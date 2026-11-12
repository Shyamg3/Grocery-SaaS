import { rupeesFromPaise } from '../lib/money'
import { fetchProducts } from '../lib/products'
import { supabase } from '../lib/supabase'
import { db, type OutboxItem, type PaymentMode } from './db'

export interface BillDraft {
  items: { productId: string; qty: number; unitPricePaise: number }[]
  payment: PaymentMode
  discountPaise?: number
  customerId?: string | null
  source?: string
}

let currentShopId: string | null = null
let flushPromise: Promise<void> | null = null
let backoffTimer: ReturnType<typeof setTimeout> | null = null
let listenerInstalled = false

export async function pullProducts(shopId: string): Promise<number> {
  const products = await fetchProducts(shopId)
  const rows = products.map((p) => ({ ...p, syncedAt: new Date().toISOString() }))
  await db.transaction('rw', db.products, async () => {
    await db.products.where('shop_id').equals(shopId).delete()
    await db.products.bulkPut(rows)
  })
  return rows.length
}

export async function enqueueBill(shopId: string, draft: BillDraft): Promise<string> {
  const item: OutboxItem = {
    id: crypto.randomUUID(),
    shopId,
    items: draft.items.map((i) => ({
      product_id: i.productId,
      qty: i.qty,
      unit_price: rupeesFromPaise(i.unitPricePaise),
    })),
    customerId: draft.customerId ?? null,
    payment: draft.payment,
    discountPaise: draft.discountPaise ?? 0,
    source: draft.source ?? 'manual',
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
    status: 'pending',
  }
  await db.outbox.add(item)
  void flushOutbox()
  return item.id
}

export function flushOutbox(): Promise<void> {
  if (flushPromise) return flushPromise
  flushPromise = doFlush().finally(() => {
    flushPromise = null
  })
  return flushPromise
}

async function doFlush(): Promise<void> {
  const items = (await db.outbox.orderBy('createdAt').toArray()).filter((i) => i.status === 'pending')
  let synced = 0
  for (const item of items) {
    let error: { message: string } | null = null
    try {
      const res = await supabase.rpc('create_bill', {
        p_bill_id: item.id,
        p_shop_id: item.shopId,
        p_items: item.items,
        p_customer_id: item.customerId,
        p_payment: item.payment,
        p_discount: rupeesFromPaise(item.discountPaise),
        p_source: item.source,
        p_created_at: item.createdAt,
      })
      error = res.error ?? null
    } catch (err) {
      error = { message: err instanceof Error ? err.message : String(err) }
    }
    if (!error) {
      await db.outbox.delete(item.id)
      synced++
      continue
    }
    const network = isNetworkError(error.message)
    await db.outbox.update(item.id, {
      attempts: item.attempts + 1,
      lastError: error.message,
      status: network ? 'pending' : 'error',
    })
    if (network) {
      // offline: retry later, no point attempting the rest now
      scheduleBackoff(item.attempts + 1)
      return
    }
  }
  if (synced > 0 && currentShopId) {
    // our own bills changed stock on the server; refresh the cache
    void pullProducts(currentShopId).catch(() => {})
  }
}

function isNetworkError(message: string): boolean {
  return /fetch|network|timeout|abort|load failed/i.test(message)
}

function scheduleBackoff(attempts: number): void {
  const delay = Math.min(5000 * 2 ** Math.max(0, attempts - 1), 300000)
  if (backoffTimer) clearTimeout(backoffTimer)
  backoffTimer = setTimeout(() => {
    backoffTimer = null
    void flushOutbox()
  }, delay)
}

export async function retrySync(): Promise<void> {
  const failed = await db.outbox.where('status').equals('error').toArray()
  await Promise.all(failed.map((f) => db.outbox.update(f.id, { status: 'pending' as const })))
  await flushOutbox()
}

export function initSync(shopId: string): void {
  currentShopId = shopId
  void pullProducts(shopId).catch(() => {})
  void flushOutbox()
  if (!listenerInstalled) {
    listenerInstalled = true
    window.addEventListener('online', () => {
      if (currentShopId) void pullProducts(currentShopId).catch(() => {})
      void flushOutbox()
    })
  }
}
