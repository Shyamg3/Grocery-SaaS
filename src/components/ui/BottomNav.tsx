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
      className="sticky bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4">
        {tabs.map(({ id, to, labelKey, Icon }) => (
          <NavLink
            key={id}
            to={to}
            end={to === '/'}
            className={({ isActive }) => {
              const on = active ? active === id : isActive
              return `flex min-h-[64px] flex-col items-center justify-center gap-0.5 py-1 ${
                on ? 'text-brand' : 'text-ink-muted'
              }`
            }}
          >
            {({ isActive }) => {
              const on = active ? active === id : isActive
              return (
                <>
                  <span className={`rounded-full px-4 py-0.5 ${on ? 'bg-brand-soft' : ''}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <T className="text-base leading-tight" subClassName="text-center" {...bi(labelKey)} />
                </>
              )
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
