import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { t, type StringKey } from '../lib/i18n'

const tabs: { to: string; labelKey: StringKey; icon: ReactNode }[] = [
  {
    to: '/billing',
    labelKey: 'nav.billing',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    to: '/products',
    labelKey: 'nav.products',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
        <path d="m3 8 9 5 9-5" />
        <path d="M12 13v9" />
      </svg>
    ),
  },
  {
    to: '/stock',
    labelKey: 'nav.stock',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="5" rx="1" />
        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
  {
    to: '/reports',
    labelKey: 'nav.reports',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M3 3v18h18" />
        <path d="M8 17v-3" />
        <path d="M13 17V7" />
        <path d="M18 17v-7" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-xs ${
                isActive ? 'text-emerald-600' : 'text-neutral-500'
              }`
            }
          >
            {tab.icon}
            <span>{t(tab.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
