import { paiseFromNumeric, rupeesFromPaise } from '../lib/money'
import { fetchCustomers } from '../lib/customers'
import { fetchProducts } from '../lib/products'
import { supabase } from '../lib/supabase'
import { db, type BillItemSnapshot, type LocalBill, type OutboxItem, type PaymentMode } from './db'

export interface BillDraft {
  id?: string
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

export async function pullCustomers(shopId: string): Promise<number> {
  const customers = await fetchCustomers(shopId)
  const rows = customers.map((c) => ({ ...c, syncedAt: new Date().toISOString() }))
  await db.transaction('rw', db.customers, async () => {
    await db.customers.where('shop_id').equals(shopId).delete()
    await db.customers.bulkPut(rows)
  })
  return rows.length
}

interface RemoteBillRow {
  id: string
  bill_no: number
  status: 'active' | 'void'
  subtotal: string
  discount: string
  total: string
  payment_mode: PaymentMode
  source: string
  created_at: string
  customer_id: string | null
}

interface RemoteBillItemRow {
  bill_id: string
  product_id: string | null
  product_name: string
  qty: string
  unit_price: string
  line_total: string
}

/** Merge the last 200 server bills into the local cache. Unsynced local bills win. */
export async function pullBills(shopId: string): Promise<number> {
  const { data: billData, error: billError } = await supabase
    .from('bills')
    .select('id, bill_no, status, subtotal, discount, total, payment_mode, source, created_at, customer_id')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (billError) throw billError
  const bills = (billData ?? []) as RemoteBillRow[]
  if (bills.length === 0) return 0

  const { data: itemData, error: itemError } = await supabase
    .from('bill_items')
    .select('bill_id, product_id, product_name, qty, unit_price, line_total')
    .in('bill_id', bills.map((b) => b.id))
  if (itemError) throw itemError
  const items = (itemData ?? []) as RemoteBillItemRow[]

  const [products, customers, localBills] = await Promise.all([
    db.products.where('shop_id').equals(shopId).toArray(),
    db.customers.where('shop_id').equals(shopId).toArray(),
    db.localBills.where('shopId').equals(shopId).toArray(),
  ])
  const productById = new Map(products.map((p) => [p.id, p]))
  const customerById = new Map(customers.map((c) => [c.id, c]))
  const localById = new Map(localBills.map((b) => [b.id, b]))

  const itemsByBill = new Map<string, RemoteBillItemRow[]>()
  for (const item of items) {
    const list = itemsByBill.get(item.bill_id) ?? []
    list.push(item)
    itemsByBill.set(item.bill_id, list)
  }

  const rows: LocalBill[] = []
  for (const bill of bills) {
    const existing = localById.get(bill.id)
    // a local bill that has not synced yet may be newer than the server copy
    if (existing && !existing.synced) continue

    const snapshots: BillItemSnapshot[] = (itemsByBill.get(bill.id) ?? []).map((item) => {
      const product = item.product_id ? productById.get(item.product_id) : undefined
      return {
        productId: item.product_id ?? '',
        name: product?.name ?? item.product_name,
        nameTa: product?.name_ta ?? null,
        unit: product?.unit ?? 'pcs',
        qtyMilli: Math.round(Number(item.qty) * 1000),
        unitPricePaise: paiseFromNumeric(item.unit_price) ?? 0,
        lineTotalPaise: paiseFromNumeric(item.line_total) ?? 0,
      }
    })

    rows.push({
      id: bill.id,
      shopId,
      createdAt: bill.created_at,
      totalPaise: paiseFromNumeric(bill.total) ?? 0,
      itemCount: snapshots.length,
      synced: true,
      billNo: bill.bill_no,
      status: bill.status,
      subtotalPaise: paiseFromNumeric(bill.subtotal) ?? 0,
      discountPaise: paiseFromNumeric(bill.discount) ?? 0,
      payment: bill.payment_mode,
      customerName: bill.customer_id ? (customerById.get(bill.customer_id)?.name ?? null) : null,
      source: bill.source,
      items: snapshots,
    })
  }
  await db.localBills.bulkPut(rows)
  return rows.length
}

export async function enqueueBill(shopId: string, draft: BillDraft): Promise<string> {
  const item: OutboxItem = {
    id: draft.id ?? crypto.randomUUID(),
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
      let serverBill: { bill_no: number; status: 'active' | 'void' } | null = null
      try {
        const res = await supabase.from('bills').select('bill_no, status').eq('id', item.id).maybeSingle()
        serverBill = res.data as { bill_no: number; status: 'active' | 'void' } | null
      } catch {
        // the bill exists server-side; the next pullBills will fill in its number
      }
      await db.localBills.update(
        item.id,
        serverBill
          ? { synced: true, billNo: serverBill.bill_no, status: serverBill.status }
          : { synced: true },
      )
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
  // bills reference product names/units and customers, so refresh those first
  void Promise.all([pullProducts(shopId), pullCustomers(shopId)])
    .catch(() => {})
    .then(() => pullBills(shopId))
    .catch(() => {})
  void flushOutbox()
  if (!listenerInstalled) {
    listenerInstalled = true
    window.addEventListener('online', () => {
      if (currentShopId) {
        void pullProducts(currentShopId).catch(() => {})
        void pullCustomers(currentShopId).catch(() => {})
        void pullBills(currentShopId).catch(() => {})
      }
      void flushOutbox()
    })
  }
}
