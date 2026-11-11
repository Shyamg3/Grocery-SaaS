import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import BillingPage from './pages/BillingPage'
import ProductsPage from './pages/ProductsPage'
import StockPage from './pages/StockPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
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
