import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import LoadingScreen from './components/LoadingScreen'
import SyncBadge from './components/SyncBadge'
import { enqueueTestBill } from './db/devTestBill'
import { initSync } from './db/sync'
import { t } from './lib/i18n'
import BillingPage from './pages/BillingPage'
import CreateShopPage from './pages/CreateShopPage'
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

  useEffect(() => {
    if (!shop) return
    initSync(shop.id)
    if (import.meta.env.DEV) {
      ;(window as unknown as { __enqueueTestBill?: () => Promise<string> }).__enqueueTestBill =
        () => enqueueTestBill(shop.id)
    }
  }, [shop?.id])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <header className="border-b border-neutral-100">
        <SyncBadge />
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/billing" replace />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
      <BottomNav />
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
    <AuthProvider>
      <ShopProvider>
        <AppGate />
      </ShopProvider>
    </AuthProvider>
  )
}
