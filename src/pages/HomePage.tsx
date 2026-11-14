import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BigActionCard from '../components/ui/BigActionCard'
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
    <div className="w-full px-4 py-5 md:px-6 md:py-8">
      {/* Greeting Banner */}
      <header className="mb-5 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink font-tamil">
          <T {...greeting} />
        </h1>
        <p className="mt-1 text-sm md:text-base text-ink-muted">
          <T {...bi('home.sub')} />
        </p>
      </header>

      {/* Main Grid: 1 col on mobile, 2 cols on tablet/desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Voice Billing Hero Card */}
        <div>
          <BigActionCard
            variant="voice"
            titleKey="home.voiceTitle"
            subtitleKey="home.voiceHint"
            footnoteKey="home.voiceFootnote"
            icon={<MicIcon className="h-8 w-8" />}
            onClick={() => navigate('/billing')}
          />
        </div>

        {/* Right Section: Stats & Quick Actions */}
        <div className="space-y-4">
          {/* Combined Today's Sales & Bills Made Card (matching Figma Screen 01) */}
          <div className="grid grid-cols-2 divide-x divide-line rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="pr-3">
              <p className="text-xs font-medium text-ink-muted">
                <T {...bi('stat.todaySales')} />
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink tabular-nums">
                {formatMoney(stats.totalPaise)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs font-medium text-ink-muted">
                <T {...bi('stat.billsMade')} />
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink tabular-nums">
                {stats.bills}
              </p>
            </div>
          </div>

          {/* Running Low Alert Card */}
          <BigActionCard
            variant="alert"
            title={biVars(stats.low > 0 ? 'home.lowStockCount' : 'home.lowStockNone', { n: stats.low })}
            subtitleKey="home.lowStockHint"
            icon={<AlertIcon className="h-6 w-6" />}
            onClick={() => navigate('/stock')}
          />

          {/* Scan & Add Stock Card */}
          <BigActionCard
            variant="plain"
            titleKey="home.scanStock"
            subtitleKey="home.scanStockHint"
            icon={<ScanIcon className="h-6 w-6" />}
            onClick={() => navigate('/stock')}
          />
        </div>
      </div>
    </div>
  )
}
