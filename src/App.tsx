import { useEffect } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import BottomNav from './components/ui/BottomNav'
import LanguageToggle from './components/ui/LanguageToggle'
import LoadingScreen from './components/LoadingScreen'
import SyncBadge from './components/SyncBadge'
import T from './components/ui/T'
import { BillIcon, HomeIcon, ReportsIcon, StockIcon } from './components/ui/icons'
import { enqueueTestBill } from './db/devTestBill'
import { initSync } from './db/sync'
import { bi, t } from './lib/i18n'
import BillingPage from './pages/BillingPage'
import CreateShopPage from './pages/CreateShopPage'
import DesignSystemPage from './pages/DesignSystemPage'
import HomePage from './pages/HomePage'
import InvoicePage from './pages/InvoicePage'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import ReportsPage from './pages/ReportsPage'
import StockPage from './pages/StockPage'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { ShopProvider, useShop } from './features/shop/ShopProvider'

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white p-6 text-center">
      <p className="text-base text-neutral-700">{t('error.generic')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[48px] rounded-xl bg-emerald-600 px-6 text-base font-bold text-white active:bg-emerald-700"
      >
        {t('common.retry')}
      </button>
    </div>
  )
}

function AppShell() {
  const { shop } = useShop()
  const { signOut } = useAuth()
  const shopId = shop?.id

  useEffect(() => {
    if (!shopId) return
    initSync(shopId)
    if (import.meta.env.DEV) {
      ;(window as unknown as { __enqueueTestBill?: () => Promise<string> }).__enqueueTestBill =
        () => enqueueTestBill(shopId)
    }
  }, [shopId])

  const navLinks = [
    { to: '/', labelKey: 'nav.home' as const, Icon: HomeIcon },
    { to: '/billing', labelKey: 'nav.bill' as const, Icon: BillIcon },
    { to: '/stock', labelKey: 'nav.stock' as const, Icon: StockIcon },
    { to: '/reports', labelKey: 'nav.reports' as const, Icon: ReportsIcon },
    { to: '/products', labelKey: 'nav.products' as const, Icon: StockIcon },
  ]

  return (
    <div className="min-h-dvh flex flex-col bg-page print:block print:min-h-0 print:bg-white text-ink">
      {/* Desktop / Tablet Navigation Header */}
      <header className="sticky top-0 z-30 hidden md:block border-b border-line bg-surface/95 backdrop-blur-md print:hidden shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white font-bold text-lg shadow-xs">
              கு
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <span>Kural kadai</span>
                <span className="text-xs text-ink-muted">·</span>
                <span className="text-sm font-tamil text-brand">குரல் கடை</span>
              </div>
              {shop?.name && (
                <div className="text-xs text-ink-muted leading-none mt-0.5">
                  {shop.name}
                </div>
              )}
            </div>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navLinks.map(({ to, labelKey, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-soft text-brand font-semibold'
                      : 'text-ink-muted hover:bg-brand-tint hover:text-ink'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <T {...bi(labelKey)} />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <SyncBadge />
            <LanguageToggle variant="headerPill" />
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-xs font-medium text-ink-muted hover:text-danger px-2 py-1 rounded-md transition-colors"
              title={t('common.signOut')}
            >
              {t('common.signOut')}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top App Bar (matching Figma Screen 01 Header) */}
      <header className="sticky top-0 z-20 flex md:hidden items-center justify-between border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur-md print:hidden shadow-xs pt-[env(safe-area-inset-top,8px)]">
        <NavLink to="/" className="min-w-0 flex-1 pr-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base leading-tight text-ink">Kural kadai</span>
          </div>
          <div className="truncate text-xs text-ink-muted leading-tight font-tamil">
            <span>குரல் கடை</span>
            {shop?.name && <span> · {shop.name}</span>}
          </div>
        </NavLink>
        <div className="flex items-center gap-2 shrink-0">
          <SyncBadge />
          <LanguageToggle variant="headerPill" />
        </div>
      </header>

      {/* Main Content Area: Responsive max-w-6xl for desktop/tablet, full-width on mobile */}
      <main className="flex-1 w-full max-w-6xl mx-auto print:block">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/bills" element={<BillingPage tab="history" />} />
          <Route path="/bills/:id" element={<InvoicePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation (Hidden on Tablet / Desktop) */}
      <div className="print:hidden">
        <BottomNav />
      </div>
    </div>
  )
}

function AppGate() {
  const { session, loading: authLoading } = useAuth()
  const { shop, loading: shopLoading, loadError, reload } = useShop()

  if (authLoading) return <LoadingScreen />
  if (!session) return <LoginPage />
  if (shopLoading) return <LoadingScreen />
  if (loadError) return <ErrorScreen onRetry={reload} />
  if (!shop) return <CreateShopPage />
  return <AppShell />
}

export default function App() {
  return (
    <Routes>
      <Route path="/design" element={<DesignSystemPage />} />
      <Route
        path="*"
        element={
          <AuthProvider>
            <ShopProvider>
              <AppGate />
            </ShopProvider>
          </AuthProvider>
        }
      />
    </Routes>
  )
}
