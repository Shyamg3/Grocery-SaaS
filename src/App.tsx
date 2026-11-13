import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/ui/BottomNav'
import LoadingScreen from './components/LoadingScreen'
import SyncBadge from './components/SyncBadge'
import { enqueueTestBill } from './db/devTestBill'
import { initSync } from './db/sync'
import { t } from './lib/i18n'
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
  const shopId = shop?.id

  useEffect(() => {
    if (!shopId) return
    initSync(shopId)
    if (import.meta.env.DEV) {
      ;(window as unknown as { __enqueueTestBill?: () => Promise<string> }).__enqueueTestBill =
        () => enqueueTestBill(shopId)
    }
  }, [shopId])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-page print:block print:min-h-0 print:bg-white">
      <header className="border-b border-neutral-100 print:hidden">
        <SyncBadge />
      </header>
      <main className="flex-1 print:block">
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
