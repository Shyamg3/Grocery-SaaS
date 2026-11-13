import { db } from '../db/db'
import { supabase } from './supabase'
import { qtyFromMilli } from './billing'
import { rupeesFromPaise } from './money'
import { insightFromRow, type StockInsightRow } from './restock'

export interface StockInLine {
  productId: string
  qtyMilli: number
  costPricePaise: number | null
}

/** Records a purchase and increases stock on the server (one transaction). */
export async function addStock(shopId: string, lines: StockInLine[], note: string | null): Promise<void> {
  const { error } = await supabase.rpc('add_stock', {
    p_shop_id: shopId,
    p_items: lines.map((line) => ({
      product_id: line.productId,
      qty: qtyFromMilli(line.qtyMilli),
      ...(line.costPricePaise === null ? {} : { cost_price: rupeesFromPaise(line.costPricePaise) }),
    })),
    p_note: note && note.trim() !== '' ? note.trim() : null,
  })
  if (error) throw new Error(error.message)
}

/** Corrects stock to a counted quantity; the server logs the difference as an adjustment. */
export async function adjustStock(
  shopId: string,
  productId: string,
  newQtyMilli: number,
  note: string,
): Promise<void> {
  const { error } = await supabase.rpc('adjust_stock', {
    p_shop_id: shopId,
    p_product_id: productId,
    p_new_qty: qtyFromMilli(newQtyMilli),
    p_note: note.trim(),
  })
  if (error) throw new Error(error.message)
}

export function isNetworkMessage(message: string): boolean {
  return /fetch|network|timeout|abort|load failed/i.test(message)
}

/** Pulls the restock numbers from the server and caches them for offline display. */
export async function refreshStockInsights(shopId: string): Promise<number> {
  const { data, error } = await supabase.rpc('stock_insights', { p_shop_id: shopId })
  if (error) throw new Error(error.message)
  const rows = ((data ?? []) as StockInsightRow[]).map(insightFromRow)
  const syncedAt = new Date().toISOString()
  await db.transaction('rw', db.stockInsights, async () => {
    await db.stockInsights.where('shopId').equals(shopId).delete()
    await db.stockInsights.bulkPut(rows.map((row) => ({ ...row, shopId, syncedAt })))
  })
  return rows.length
}
