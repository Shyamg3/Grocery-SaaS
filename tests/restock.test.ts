import { describe, expect, it } from 'vitest'
import {
  buildShoppingListText,
  daysLeftLabel,
  insightFromRow,
  isLowStock,
  roundSuggestedQty,
  type StockInsight,
} from '../src/lib/restock'

const insight = (over: Partial<StockInsight> = {}): StockInsight => ({
  productId: 'p1',
  sold14d: 14,
  avgDaily: 1,
  daysLeft: 2,
  suggestedQty: 5,
  ...over,
})

describe('insightFromRow', () => {
  it('parses numeric strings from Postgres', () => {
    const parsed = insightFromRow({
      product_id: 'abc',
      sold_14d: '28',
      avg_daily: '2.000',
      days_left: '1.5',
      suggested_qty: '11.000',
    })
    expect(parsed).toEqual({
      productId: 'abc',
      sold14d: 28,
      avgDaily: 2,
      daysLeft: 1.5,
      suggestedQty: 11,
    })
  })

  it('keeps days_left null when nothing sold', () => {
    const parsed = insightFromRow({
      product_id: 'abc',
      sold_14d: 0,
      avg_daily: 0,
      days_left: null,
      suggested_qty: 0,
    })
    expect(parsed.daysLeft).toBeNull()
  })
})

describe('roundSuggestedQty', () => {
  it('rounds counted units up to whole packs', () => {
    expect(roundSuggestedQty(2.1, 'pcs')).toBe(3)
    expect(roundSuggestedQty(7, 'pack')).toBe(7)
    expect(roundSuggestedQty(0.2, 'g')).toBe(1)
  })

  it('rounds kg and litres up to half steps', () => {
    expect(roundSuggestedQty(2.1, 'kg')).toBe(2.5)
    expect(roundSuggestedQty(2.6, 'kg')).toBe(3)
    expect(roundSuggestedQty(1.2, 'l')).toBe(1.5)
  })

  it('never suggests a negative or fractional-less zero', () => {
    expect(roundSuggestedQty(0, 'kg')).toBe(0)
    expect(roundSuggestedQty(-3, 'pcs')).toBe(0)
    expect(roundSuggestedQty(Number.NaN, 'pcs')).toBe(0)
  })
})

describe('isLowStock', () => {
  it('is low when at or below the reorder level', () => {
    expect(isLowStock(3, 3, undefined, 7)).toBe(true)
    expect(isLowStock(2, 5, undefined, 7)).toBe(true)
  })

  it('is low when days left are under the cover days', () => {
    expect(isLowStock(10, 0, insight({ daysLeft: 2 }), 7)).toBe(true)
    expect(isLowStock(10, 0, insight({ daysLeft: 2 }), 3)).toBe(true)
    expect(isLowStock(10, 0, insight({ daysLeft: 4 }), 3)).toBe(false)
  })

  it('is not low on stock alone when nothing has sold', () => {
    expect(isLowStock(10, 2, insight({ daysLeft: null, suggestedQty: 0 }), 7)).toBe(false)
    expect(isLowStock(10, 2, undefined, 7)).toBe(false)
  })
})

describe('daysLeftLabel', () => {
  it('formats days left for the row', () => {
    expect(daysLeftLabel(null)).toBe('—')
    expect(daysLeftLabel(0.4)).toBe('<1')
    expect(daysLeftLabel(2.46)).toBe('2.5')
    expect(daysLeftLabel(14.2)).toBe('14')
  })
})

describe('buildShoppingListText', () => {
  it('lists names in both languages with quantity and unit', () => {
    const text = buildShoppingListText('Sri Stores', 'Supplier list', [
      { name: 'Rice', nameTa: 'அரிசி', qty: 5, unitLabel: 'kg' },
      { name: 'Milk', nameTa: null, qty: 6, unitLabel: 'pack' },
    ])
    expect(text).toBe(
      ['Sri Stores', 'Supplier list', '', 'Rice (அரிசி) — 5 kg', 'Milk — 6 pack'].join('\n'),
    )
  })
})
