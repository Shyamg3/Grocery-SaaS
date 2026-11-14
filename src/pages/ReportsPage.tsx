import { liveQuery } from 'dexie'
import { useEffect, useMemo, useState } from 'react'
import T from '../components/ui/T'
import { SpeakerIcon } from '../components/ui/icons'
import { db, type LocalBill, type ProductCache } from '../db/db'
import { useShop } from '../features/shop/ShopProvider'
import { bi, t } from '../lib/i18n'
import { formatMoney } from '../lib/money'

type DateFilter = 'today' | 'week' | 'month'

export default function ReportsPage() {
  const { shop } = useShop()
  const shopId = shop?.id ?? null

  const [filter, setFilter] = useState<DateFilter>('today')
  const [bills, setBills] = useState<LocalBill[]>([])
  const [products, setProducts] = useState<ProductCache[]>([])
  const [taVoice, setTaVoice] = useState<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    function updateVoices() {
      const all = window.speechSynthesis.getVoices()
      const match =
        all.find((v) => v.lang === 'ta-IN' || v.lang.startsWith('ta')) ??
        all.find((v) => v.lang === 'en-IN') ??
        null
      setTaVoice(match)
    }
    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

  useEffect(() => {
    if (!shopId) return
    const sub = liveQuery(async () => {
      const [allBills, allProducts] = await Promise.all([
        db.localBills.where('shopId').equals(shopId).toArray(),
        db.products.where('shop_id').equals(shopId).toArray(),
      ])
      return { allBills, allProducts }
    }).subscribe({
      next: ({ allBills, allProducts }) => {
        setBills(allBills)
        setProducts(allProducts)
      },
    })
    return () => sub.unsubscribe()
  }, [shopId])

  const productCostMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      if (p.cost_price !== null && p.cost_price !== undefined) {
        map.set(p.id, p.cost_price)
      }
    }
    return map
  }, [products])

  const filteredBills = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfWeek = startOfToday - now.getDay() * 24 * 60 * 60 * 1000
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    return bills.filter((b) => {
      if (b.status === 'void') return false
      const time = new Date(b.createdAt).getTime()
      if (filter === 'today') return time >= startOfToday
      if (filter === 'week') return time >= startOfWeek
      return time >= startOfMonth
    })
  }, [bills, filter])

  const summary = useMemo(() => {
    let totalSalesPaise = 0
    let totalCostPaise = 0
    let cashPaise = 0
    let upiPaise = 0
    let otherPaise = 0

    // Time buckets for hourly chart: 8-10, 10-12, 12-2, 2-4, 4-6, 6-8, 8-10
    const buckets = [
      { label: '8-10', count: 0, totalPaise: 0 },
      { label: '10-12', count: 0, totalPaise: 0 },
      { label: '12-2', count: 0, totalPaise: 0 },
      { label: '2-4', count: 0, totalPaise: 0 },
      { label: '4-6', count: 0, totalPaise: 0 },
      { label: '6-8', count: 0, totalPaise: 0 },
      { label: '8-10', count: 0, totalPaise: 0 },
    ]

    for (const b of filteredBills) {
      totalSalesPaise += b.totalPaise
      if (b.payment === 'cash') cashPaise += b.totalPaise
      else if (b.payment === 'upi') upiPaise += b.totalPaise
      else otherPaise += b.totalPaise

      // Hourly bucket
      const hour = new Date(b.createdAt).getHours()
      let bIdx = -1
      if (hour >= 8 && hour < 10) bIdx = 0
      else if (hour >= 10 && hour < 12) bIdx = 1
      else if (hour >= 12 && hour < 14) bIdx = 2
      else if (hour >= 14 && hour < 16) bIdx = 3
      else if (hour >= 16 && hour < 18) bIdx = 4
      else if (hour >= 18 && hour < 20) bIdx = 5
      else if (hour >= 20 && hour < 22) bIdx = 6

      if (bIdx >= 0) {
        buckets[bIdx].count++
        buckets[bIdx].totalPaise += b.totalPaise
      }

      // Cost estimation from items
      if (b.items && b.items.length > 0) {
        for (const item of b.items) {
          const cost = productCostMap.get(item.productId)
          if (cost !== undefined) {
            totalCostPaise += Math.round((cost * item.qtyMilli) / 1000)
          } else {
            // Fallback estimation if cost is missing: assume 80% cost
            totalCostPaise += Math.round(item.lineTotalPaise * 0.8)
          }
        }
      } else {
        totalCostPaise += Math.round(b.totalPaise * 0.8)
      }
    }

    const grossProfitPaise = Math.max(0, totalSalesPaise - totalCostPaise)
    const maxBucketPaise = Math.max(1, ...buckets.map((b) => b.totalPaise))

    return {
      billCount: filteredBills.length,
      totalSalesPaise,
      totalCostPaise,
      grossProfitPaise,
      cashPaise,
      upiPaise,
      otherPaise,
      buckets,
      maxBucketPaise,
    }
  }, [filteredBills, productCostMap])

  function handleListenReport() {
    if (!('speechSynthesis' in window)) return
    const text = `${bi('reports.totalSales').ta} ${formatMoney(summary.totalSalesPaise)}. ${summary.billCount} ${bi('reports.billsCount').ta}. ${bi('reports.grossProfit').ta} ${formatMoney(summary.grossProfitPaise)}.`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ta-IN'
    if (taVoice) utterance.voice = taVoice
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const currentDateLabel = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="w-full px-4 py-4 md:px-6 md:py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-ink font-tamil">
          <T {...bi('reports.title')} />
        </h1>
        <p className="text-xs md:text-sm text-ink-muted">
          {filter === 'today' ? `${t('reports.today')}, ${currentDateLabel}` : shop?.name}
        </p>
      </div>

      {/* Date Filter Tabs */}
      <div className="mb-5 inline-flex rounded-full border border-line bg-surface p-1 shadow-xs">
        {(['today', 'week', 'month'] as const).map((key) => {
          const active = filter === key
          const labelKey = key === 'today' ? 'reports.today' : key === 'week' ? 'reports.thisWeek' : 'reports.thisMonth'
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`min-h-[40px] rounded-full px-5 text-sm font-semibold transition-all ${
                active ? 'bg-brand text-white shadow-xs' : 'text-ink-muted hover:text-ink active:bg-brand-tint'
              }`}
            >
              <T {...bi(labelKey)} />
            </button>
          )
        })}
      </div>

      {/* Audio Listen Bar (matching Figma Screen 04) */}
      <div className="mb-5 flex items-center justify-between rounded-card border border-brand-soft bg-brand-tint px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-brand font-medium text-sm">
          <SpeakerIcon className="h-5 w-5" />
          <T {...bi('reports.listen')} />
        </div>
        <button
          type="button"
          onClick={handleListenReport}
          className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-dark active:scale-95"
        >
          <T {...bi('reports.listenAction')} />
        </button>
      </div>

      {/* Main Grid: 1 col on mobile, 2 cols on tablet/desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Left Column: Total Sales & Profit Breakdown */}
        <div className="space-y-4">
          {/* Total Sales Hero Card (matching Figma Screen 04) */}
          <div className="rounded-card bg-brand p-6 text-white shadow-raised">
            <div className="text-sm font-medium text-white/85">
              <T {...bi('reports.totalSales')} />
            </div>
            <div className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight tabular-nums">
              {formatMoney(summary.totalSalesPaise)}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs font-semibold text-white/90">
              <span className="flex items-center gap-1">
                <span>↑ 12%</span>
                <span className="text-white/70">
                  <T {...bi('reports.vsYesterday')} />
                </span>
              </span>
              <span className="tabular-nums">
                {summary.billCount} {t('reports.billsCount', { n: summary.billCount })}
              </span>
            </div>
          </div>

          {/* Cost & Profit Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-line bg-surface p-4 shadow-card">
              <div className="text-xs font-medium text-ink-muted">
                <T {...bi('reports.stockCostSold')} />
              </div>
              <div className="mt-2 text-xl md:text-2xl font-bold tracking-tight text-ink tabular-nums">
                {formatMoney(summary.totalCostPaise)}
              </div>
            </div>
            <div className="rounded-card border border-line bg-surface p-4 shadow-card">
              <div className="text-xs font-medium text-ink-muted">
                <T {...bi('reports.grossProfit')} />
              </div>
              <div className="mt-2 text-xl md:text-2xl font-bold tracking-tight text-brand tabular-nums">
                {formatMoney(summary.grossProfitPaise)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hourly Chart & Payment Breakdown */}
        <div className="space-y-4">
          {/* When Did You Sell? Chart (matching Figma Screen 04) */}
          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-ink">
                <T {...bi('reports.whenDidYouSell')} />
              </span>
              <span className="text-xs font-medium text-ink-muted">
                {filter === 'today' ? t('reports.today') : t('reports.thisWeek')} ▾
              </span>
            </div>

            {/* Bar Chart Visualization */}
            <div className="flex items-end justify-between gap-2 h-36 pt-4 border-b border-line pb-2">
              {summary.buckets.slice(0, 5).map((bucket, idx) => {
                const heightPct = Math.max(12, Math.round((bucket.totalPaise / summary.maxBucketPaise) * 100))
                const isHighlight = idx === 4 || bucket.totalPaise === summary.maxBucketPaise
                return (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-medium text-ink-muted tabular-nums">
                      {bucket.totalPaise > 0 ? Math.round(bucket.totalPaise / 100) : ''}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[32px] rounded-t-md transition-all ${
                        isHighlight ? 'bg-brand' : 'bg-brand-soft'
                      }`}
                    />
                    <span className="text-[10px] font-medium text-ink-muted mt-1">{bucket.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payments Received Breakdown */}
          <div className="rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="text-xs font-semibold text-ink-muted mb-3">
              <T {...bi('reports.paymentsReceived')} />
            </div>
            <div className="grid grid-cols-2 divide-x divide-line">
              <div className="pr-3">
                <span className="text-xs font-medium text-ink-muted">
                  <T {...bi('payment.cash')} />
                </span>
                <p className="mt-1 text-lg font-bold text-ink tabular-nums">
                  {formatMoney(summary.cashPaise)}
                </p>
              </div>
              <div className="pl-4">
                <span className="text-xs font-medium text-ink-muted">
                  <T {...bi('payment.upi')} />
                </span>
                <p className="mt-1 text-lg font-bold text-ink tabular-nums">
                  {formatMoney(summary.upiPaise)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
