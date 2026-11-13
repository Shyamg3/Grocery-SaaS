import { describe, expect, it } from 'vitest'
import type { LocalBill } from '../src/db/db'
import {
  addProductToLines,
  clampDiscount,
  formatQty,
  groupBillsByDay,
  lineTotalPaise,
  localDayKey,
  parseQty,
  qtyFromMilli,
  subtotalPaise,
  summarizeToday,
  totalPaise,
  type CartLine,
  type CartProduct,
} from '../src/lib/billing'

const rice: CartProduct = { id: 'p1', name: 'Rice', name_ta: 'அரிசி', unit: 'kg', sell_price: 5599 }
const soap: CartProduct = { id: 'p2', name: 'Soap', name_ta: null, unit: 'pcs', sell_price: 4500 }

const lines: CartLine[] = [
  {
    productId: 'p1',
    name: 'Rice',
    nameTa: 'அரிசி',
    unit: 'kg',
    unitPricePaise: 5599,
    qtyMilli: 1500,
  },
  {
    productId: 'p2',
    name: 'Soap',
    nameTa: null,
    unit: 'pcs',
    unitPricePaise: 4500,
    qtyMilli: 1000,
  },
]

describe('parseQty', () => {
  it('accepts decimals for kg and l', () => {
    expect(parseQty('1.25', 'kg')).toBe(1250)
    expect(parseQty('0.5', 'l')).toBe(500)
    expect(parseQty('2', 'kg')).toBe(2000)
    expect(parseQty('0.001', 'kg')).toBe(1)
    expect(parseQty(' 2.5 ', 'l')).toBe(2500)
  })

  it('rejects decimals for count units', () => {
    expect(parseQty('1.5', 'pcs')).toBeNull()
    expect(parseQty('2.5', 'pack')).toBeNull()
    expect(parseQty('2', 'pcs')).toBe(2000)
  })

  it('rejects zero, empty, negative and over-precise input', () => {
    expect(parseQty('0', 'kg')).toBeNull()
    expect(parseQty('0.000', 'kg')).toBeNull()
    expect(parseQty('', 'kg')).toBeNull()
    expect(parseQty('-1', 'kg')).toBeNull()
    expect(parseQty('1.2345', 'kg')).toBeNull()
    expect(parseQty('1.', 'kg')).toBeNull()
    expect(parseQty('1000000', 'kg')).toBeNull()
  })
})

describe('formatQty / qtyFromMilli', () => {
  it('drops trailing zeros but keeps real decimals', () => {
    expect(formatQty(1000)).toBe('1')
    expect(formatQty(1250)).toBe('1.25')
    expect(formatQty(500)).toBe('0.5')
    expect(formatQty(1)).toBe('0.001')
    expect(formatQty(123456)).toBe('123.456')
  })

  it('converts milli-units back to the numeric qty sent to the server', () => {
    expect(qtyFromMilli(1250)).toBe(1.25)
    expect(qtyFromMilli(1000)).toBe(1)
    expect(qtyFromMilli(1)).toBe(0.001)
  })
})

describe('money math', () => {
  it('rounds only at the line level', () => {
    expect(lineTotalPaise(5599, 1500)).toBe(8399) // 83.985 -> 83.99
    expect(lineTotalPaise(333, 500)).toBe(167) // 1.665 -> 1.67
    expect(lineTotalPaise(100, 333)).toBe(33) // 0.333 -> 0.33
    expect(lineTotalPaise(4500, 1000)).toBe(4500)
  })

  it('rounds exact half-paise line totals up', () => {
    expect(lineTotalPaise(1, 1500)).toBe(2) // 1.5 paise
    expect(lineTotalPaise(1, 500)).toBe(1) // 0.5 paise
    expect(lineTotalPaise(1, 2500)).toBe(3) // 2.5 paise
    expect(lineTotalPaise(999, 333)).toBe(333) // 332.667 -> 333
  })

  it('treats zero quantity or zero price lines as zero', () => {
    expect(lineTotalPaise(5599, 0)).toBe(0)
    expect(lineTotalPaise(0, 1500)).toBe(0)
    expect(subtotalPaise([{ ...lines[0], qtyMilli: 0 }])).toBe(0)
  })

  it('adds rounded line totals, not the rounded sum', () => {
    const halves: CartLine[] = [
      { ...lines[0], unitPricePaise: 333, qtyMilli: 500 },
      { ...lines[1], unitPricePaise: 333, qtyMilli: 500 },
    ]
    expect(subtotalPaise(halves)).toBe(334) // 166.5 + 166.5 -> 167 + 167
  })

  it('adds line totals in paise', () => {
    expect(subtotalPaise(lines)).toBe(12899)
    expect(subtotalPaise([])).toBe(0)
  })

  it('clamps discount into 0..subtotal', () => {
    expect(clampDiscount(500, 12899)).toBe(500)
    expect(clampDiscount(20000, 12899)).toBe(12899)
    expect(clampDiscount(-100, 12899)).toBe(0)
    expect(clampDiscount(Number.NaN, 12899)).toBe(0)
  })

  it('rounds fractional discount paise before clamping', () => {
    expect(clampDiscount(499.6, 1000)).toBe(500)
    expect(clampDiscount(0.4, 1000)).toBe(0)
    expect(clampDiscount(Infinity, 1000)).toBe(0)
    expect(clampDiscount(100, 0)).toBe(0)
  })

  it('computes an exact integer-paise total', () => {
    expect(totalPaise(lines, 500)).toBe(12399)
    expect(totalPaise(lines, 999999)).toBe(0)
    expect(totalPaise(lines, 0)).toBe(12899)
    expect(totalPaise(lines, 12899)).toBe(0)
    expect(totalPaise([], 500)).toBe(0)
  })

  it('stays exact for large but realistic line amounts', () => {
    expect(lineTotalPaise(99999999, 1000)).toBe(99999999)
    expect(lineTotalPaise(123456789, 999)).toBe(123333332) // 123333332.211 -> 123333332
  })
})

describe('addProductToLines', () => {
  it('adds a new line with quantity 1', () => {
    const next = addProductToLines([], rice)
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ productId: 'p1', qtyMilli: 1000, unitPricePaise: 5599 })
  })

  it('increments an existing line instead of duplicating it', () => {
    const once = addProductToLines([], rice)
    const twice = addProductToLines(once, rice)
    expect(twice).toHaveLength(1)
    expect(twice[0].qtyMilli).toBe(2000)
  })

  it('keeps different products separate', () => {
    const next = addProductToLines(addProductToLines([], rice), soap)
    expect(next.map((l) => l.productId)).toEqual(['p1', 'p2'])
  })
})

describe('summarizeToday', () => {
  const bill = (id: string, createdAt: Date, total: number): LocalBill => ({
    id,
    shopId: 'shop-1',
    createdAt: createdAt.toISOString(),
    totalPaise: total,
    itemCount: 1,
    synced: true,
  })

  it('sums only bills from the local calendar day', () => {
    const now = new Date(2026, 10, 13, 18, 30)
    const bills = [
      bill('a', new Date(2026, 10, 13, 9, 0), 12000),
      bill('b', new Date(2026, 10, 13, 14, 15), 5500),
      bill('c', new Date(2026, 10, 12, 23, 59), 9999),
      bill('d', new Date(2026, 9, 13, 10, 0), 7777),
    ]
    expect(summarizeToday(bills, now)).toEqual({ totalPaise: 17500, bills: 2 })
  })

  it('returns zeros with no bills', () => {
    expect(summarizeToday([], new Date(2026, 10, 13))).toEqual({ totalPaise: 0, bills: 0 })
  })

  it('ignores voided bills', () => {
    const now = new Date(2026, 10, 13, 18, 30)
    const bills = [
      bill('a', new Date(2026, 10, 13, 9, 0), 12000),
      { ...bill('b', new Date(2026, 10, 13, 14, 15), 5500), status: 'void' as const },
    ]
    expect(summarizeToday(bills, now)).toEqual({ totalPaise: 12000, bills: 1 })
  })
})

describe('groupBillsByDay', () => {
  const bill = (id: string, createdAt: Date, total = 1000): LocalBill => ({
    id,
    shopId: 'shop-1',
    createdAt: createdAt.toISOString(),
    totalPaise: total,
    itemCount: 1,
    synced: true,
  })

  it('groups by local day, newest first', () => {
    const groups = groupBillsByDay([
      bill('old', new Date(2026, 10, 12, 9, 0)),
      bill('late', new Date(2026, 10, 13, 21, 0)),
      bill('early', new Date(2026, 10, 13, 8, 0)),
    ])
    expect(groups.map((g) => g.dayKey)).toEqual([localDayKey(new Date(2026, 10, 13)), localDayKey(new Date(2026, 10, 12))])
    expect(groups[0].bills.map((b) => b.id)).toEqual(['late', 'early'])
    expect(groups[1].bills.map((b) => b.id)).toEqual(['old'])
  })

  it('returns an empty array with no bills', () => {
    expect(groupBillsByDay([])).toEqual([])
  })
})
