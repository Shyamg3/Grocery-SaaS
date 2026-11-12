import Dexie, { type EntityTable } from 'dexie'
import type { Product } from '../lib/products'

export type PaymentMode = 'cash' | 'upi' | 'card' | 'credit'

export interface ProductCache extends Product {
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
}

db.version(1).stores({
  products: 'id, shop_id',
  outbox: 'id, status, createdAt',
})
