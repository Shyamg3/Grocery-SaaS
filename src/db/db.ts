import Dexie, { type EntityTable } from 'dexie'
import type { Product, Unit } from '../lib/products'
import type { StockInsight } from '../lib/restock'

export type PaymentMode = 'cash' | 'upi' | 'card' | 'credit'
export type BillStatus = 'active' | 'void'

export interface ProductCache extends Product {
  syncedAt: string
}

export interface CustomerCache {
  id: string
  shop_id: string
  name: string
  phone: string | null
  syncedAt: string
}

export interface BillItemSnapshot {
  productId: string
  name: string
  nameTa: string | null
  unit: Unit
  qtyMilli: number
  unitPricePaise: number
  lineTotalPaise: number
}

export interface LocalBill {
  id: string
  shopId: string
  createdAt: string
  totalPaise: number
  itemCount: number
  synced: boolean
  // snapshot for the invoice; absent on rows created before this feature
  billNo?: number | null
  status?: BillStatus
  subtotalPaise?: number
  discountPaise?: number
  payment?: PaymentMode
  customerName?: string | null
  source?: string
  items?: BillItemSnapshot[]
}

export interface StockInsightCache extends StockInsight {
  shopId: string
  syncedAt: string
}

export interface OutboxItem {
  id: string // client-generated bill UUID; doubles as p_bill_id for the create_bill RPC
  shopId: string
  items: { product_id: string; qty: number; unit_price: string }[]
  customerId: string | null
  payment: PaymentMode
  discountPaise: number
  source: string
  createdAt: string
  attempts: number
  lastError: string | null
  status: 'pending' | 'error'
}

export const db = new Dexie('shopapp') as Dexie & {
  products: EntityTable<ProductCache, 'id'>
  outbox: EntityTable<OutboxItem, 'id'>
  customers: EntityTable<CustomerCache, 'id'>
  localBills: EntityTable<LocalBill, 'id'>
  stockInsights: EntityTable<StockInsightCache, 'productId'>
}

db.version(1).stores({
  products: 'id, shop_id',
  outbox: 'id, status, createdAt',
})

db.version(2).stores({
  products: 'id, shop_id',
  outbox: 'id, status, createdAt',
  customers: 'id, shop_id',
  localBills: 'id, shopId, createdAt',
})

db.version(3).stores({
  products: 'id, shop_id',
  outbox: 'id, status, createdAt',
  customers: 'id, shop_id',
  localBills: 'id, shopId, createdAt',
  stockInsights: 'productId, shopId',
})
