import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { bi, type StringKey } from '../../lib/i18n'
import T from './T'
import { BillIcon, HomeIcon, ReportsIcon, StockIcon } from './icons'

export type NavTabId = 'home' | 'bill' | 'stock' | 'reports'

const tabs: { id: NavTabId; to: string; labelKey: StringKey; Icon: ComponentType<{ className?: string }> }[] = [
  { id: 'home', to: '/', labelKey: 'nav.home', Icon: HomeIcon },
  { id: 'bill', to: '/billing', labelKey: 'nav.bill', Icon: BillIcon },
  { id: 'stock', to: '/stock', labelKey: 'nav.stock', Icon: StockIcon },
  { id: 'reports', to: '/reports', labelKey: 'nav.reports', Icon: ReportsIcon },
]

export default function BottomNav({ active }: { active?: NavTabId }) {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg"
    >
      <div className="grid grid-cols-4">
        {tabs.map(({ id, to, labelKey, Icon }) => (
          <NavLink
            key={id}
            to={to}
            end={to === '/'}
            className={({ isActive }) => {
              const on = active ? active === id : isActive
              return `flex min-h-[60px] flex-col items-center justify-center gap-1 py-1.5 transition-colors ${
                on ? 'text-brand' : 'text-ink-muted hover:text-ink active:scale-95'
              }`
            }}
          >
            {({ isActive }) => {
              const on = active ? active === id : isActive
              return (
                <>
                  <span
                    className={`flex items-center justify-center rounded-full px-4 py-1 transition-colors ${
                      on ? 'bg-brand-soft text-brand' : 'text-ink-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-medium leading-none tracking-tight">
                    <T {...bi(labelKey)} />
                  </span>
                </>
              )
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
