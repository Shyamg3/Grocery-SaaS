import type { LocalBill } from '../db/db'
import type { Unit } from './products'

export interface CartLine {
  productId: string
  name: string
  nameTa: string | null
  unit: Unit
  unitPricePaise: number
  qtyMilli: number
}

export interface CartProduct {
  id: string
  name: string
  name_ta: string | null
  unit: Unit
  sell_price: number
}

const DECIMAL_UNITS: readonly Unit[] = ['kg', 'l']
const MAX_QTY_MILLI = 999_999_000

/** Quantity is held as integer thousandths (1.25 kg = 1250) so no float math touches money. */
export function parseQty(input: string, unit: Unit): number | null {
  const text = input.trim()
  const allowDecimal = DECIMAL_UNITS.includes(unit)
  const pattern = allowDecimal ? /^\d{1,6}(?:\.\d{1,3})?$/ : /^\d{1,6}$/
  if (!pattern.test(text)) return null
  const [whole, frac = ''] = text.split('.')
  const milli = Number(whole) * 1000 + Number(frac.padEnd(3, '0'))
  if (milli <= 0 || milli > MAX_QTY_MILLI) return null
  return milli
}

export function formatQty(qtyMilli: number): string {
  const whole = Math.floor(qtyMilli / 1000)
  const frac = String(qtyMilli % 1000).padStart(3, '0').replace(/0+$/, '')
  return frac.length > 0 ? `${whole}.${frac}` : String(whole)
}

export function qtyFromMilli(qtyMilli: number): number {
  return Number((qtyMilli / 1000).toFixed(3))
}

export function lineTotalPaise(unitPricePaise: number, qtyMilli: number): number {
  return Math.round((unitPricePaise * qtyMilli) / 1000)
}

export function subtotalPaise(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalPaise(line.unitPricePaise, line.qtyMilli), 0)
}

export function clampDiscount(discountPaise: number, subtotal: number): number {
  if (!Number.isFinite(discountPaise)) return 0
  return Math.min(Math.max(Math.round(discountPaise), 0), subtotal)
}

export function totalPaise(lines: CartLine[], discountPaise: number): number {
  const subtotal = subtotalPaise(lines)
  return subtotal - clampDiscount(discountPaise, subtotal)
}

export function addProductToLines(lines: CartLine[], product: CartProduct): CartLine[] {
  const index = lines.findIndex((line) => line.productId === product.id)
  if (index === -1) {
    return [
      ...lines,
      {
        productId: product.id,
        name: product.name,
        nameTa: product.name_ta,
        unit: product.unit,
        unitPricePaise: product.sell_price,
        qtyMilli: 1000,
      },
    ]
  }
  const next = [...lines]
  next[index] = { ...next[index], qtyMilli: next[index].qtyMilli + 1000 }
  return next
}

export function isSameLocalDay(iso: string, now: Date): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function summarizeToday(bills: LocalBill[], now: Date = new Date()): {
  totalPaise: number
  bills: number
} {
  let total = 0
  let count = 0
  for (const bill of bills) {
    if (bill.status === 'void') continue
    if (!isSameLocalDay(bill.createdAt, now)) continue
    total += bill.totalPaise
    count += 1
  }
  return { totalPaise: total, bills: count }
}

export function localDayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

/** Newest first, grouped by the local calendar day. */
export function groupBillsByDay(bills: LocalBill[]): { dayKey: string; bills: LocalBill[] }[] {
  const sorted = [...bills].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const groups: { dayKey: string; bills: LocalBill[] }[] = []
  for (const bill of sorted) {
    const key = localDayKey(new Date(bill.createdAt))
    const last = groups[groups.length - 1]
    if (last && last.dayKey === key) last.bills.push(bill)
    else groups.push({ dayKey: key, bills: [bill] })
  }
  return groups
}
