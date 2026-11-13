import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BigActionCard from '../components/ui/BigActionCard'
import StatCard from '../components/ui/StatCard'
import T from '../components/ui/T'
import { AlertIcon, MicIcon, ScanIcon } from '../components/ui/icons'
import { db } from '../db/db'
import { useAuth } from '../features/auth/AuthProvider'
import { useShop } from '../features/shop/ShopProvider'
import { summarizeToday } from '../lib/billing'
import { bi, biVars } from '../lib/i18n'
import { formatMoney } from '../lib/money'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const { shop } = useShop()
  const { session } = useAuth()
  const navigate = useNavigate()
  const shopId = shop?.id ?? null

  const [name, setName] = useState('')
  const [stats, setStats] = useState({ totalPaise: 0, bills: 0, low: 0 })

  useEffect(() => {
    const emailName = session?.user.email?.split('@')[0] ?? ''
    const meta = session?.user.user_metadata as Record<string, unknown> | undefined
    const metaName = typeof meta?.display_name === 'string' ? meta.display_name : ''
    setName(metaName || emailName)

    if (!session) return
    let cancelled = false
    void (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', session.user.id)
          .maybeSingle()
        const row = data as { display_name: string | null } | null
        if (!cancelled && row?.display_name) setName(row.display_name)
      } catch {
        // profiles may not exist yet; the sign-in name is a fine fallback
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!shopId) return
    const sub = liveQuery(async () => {
      const [bills, products] = await Promise.all([
        db.localBills.where('shopId').equals(shopId).toArray(),
        db.products.where('shop_id').equals(shopId).toArray(),
      ])
      const today = summarizeToday(bills)
      const low = products.filter((p) => p.is_active && p.stock_qty <= p.reorder_level).length
      return { ...today, low }
    }).subscribe({
      next: setStats,
      error: () => setStats({ totalPaise: 0, bills: 0, low: 0 }),
    })
    return () => sub.unsubscribe()
  }, [shopId])

  const greeting = name
    ? biVars('home.greetingName', { name })
    : bi('home.greetingPlain')

  return (
    <div className="min-h-dvh bg-page px-4 pt-5 pb-6">
      <header>
        <h1>
          <T className="text-2xl font-bold leading-snug text-ink" {...greeting} />
        </h1>
        <p className="mt-1">
          <T className="text-sm" {...bi('home.sub')} />
        </p>
      </header>

      <div className="mt-5">
        <BigActionCard
          variant="voice"
          titleKey="home.voiceTitle"
          subtitleKey="home.voiceHint"
          icon={<MicIcon className="h-7 w-7" />}
          onClick={() => navigate('/billing')}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard labelKey="stat.todaySales" value={formatMoney(stats.totalPaise)} tone="brand" />
        <StatCard labelKey="stat.billsMade" value={String(stats.bills)} />
      </div>

      <div className="mt-4 space-y-3">
        <BigActionCard
          title={biVars(stats.low > 0 ? 'home.lowStockCount' : 'home.lowStockNone', { n: stats.low })}
          subtitleKey="home.lowStockHint"
          icon={<AlertIcon className="h-6 w-6" />}
          onClick={() => navigate('/stock')}
        />
        <BigActionCard
          titleKey="home.scanStock"
          subtitleKey="home.scanStockHint"
          icon={<ScanIcon className="h-6 w-6" />}
          onClick={() => navigate('/stock')}
        />
      </div>
    </div>
  )
}
