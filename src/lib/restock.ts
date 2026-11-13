import type { Unit } from './products'

export interface StockInsight {
  productId: string
  sold14d: number
  avgDaily: number
  daysLeft: number | null
  suggestedQty: number
}

export interface StockInsightRow {
  product_id: string
  sold_14d: string | number
  avg_daily: string | number
  days_left: string | number | null
  suggested_qty: string | number
}

const HALF_STEP_UNITS: readonly Unit[] = ['kg', 'l']

export function insightFromRow(row: StockInsightRow): StockInsight {
  return {
    productId: row.product_id,
    sold14d: Number(row.sold_14d),
    avgDaily: Number(row.avg_daily),
    daysLeft: row.days_left === null ? null : Number(row.days_left),
    suggestedQty: Number(row.suggested_qty),
  }
}

/** Whole packs for counted units, half-unit steps for weight/volume. */
export function roundSuggestedQty(suggested: number, unit: Unit): number {
  if (!Number.isFinite(suggested) || suggested <= 0) return 0
  if (HALF_STEP_UNITS.includes(unit)) return Math.ceil(suggested * 2) / 2
  return Math.ceil(suggested)
}

export function isLowStock(
  stockQty: number,
  reorderLevel: number,
  insight: StockInsight | undefined,
  coverDays: number,
): boolean {
  if (stockQty <= reorderLevel) return true
  if (!insight || insight.daysLeft === null) return false
  return insight.daysLeft < coverDays
}

/** "—" when nothing has sold, "<1" for under a day, one decimal under 10 days. */
export function daysLeftLabel(days: number | null): string {
  if (days === null || !Number.isFinite(days)) return '—'
  if (days < 1) return '<1'
  if (days < 10) return String(Math.round(days * 10) / 10)
  return String(Math.round(days))
}

export interface ShoppingListEntry {
  name: string
  nameTa: string | null
  qty: number
  unitLabel: string
}

/** Plain-text supplier list shared over WhatsApp. */
export function buildShoppingListText(shopName: string, title: string, entries: ShoppingListEntry[]): string {
  const lines = [shopName, title, '']
  for (const entry of entries) {
    const name = entry.nameTa ? `${entry.name} (${entry.nameTa})` : entry.name
    lines.push(`${name} — ${entry.qty} ${entry.unitLabel}`)
  }
  return lines.join('\n')
}
