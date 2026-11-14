import { describe, expect, it } from 'vitest'
import type { ProductCache } from '../src/db/db'
import { mergeCartLines } from '../src/lib/billing'
import {
  buildDraftRows,
  candidatesFor,
  createProductFuse,
  normalizeUnit,
  productHasSpokenName,
  qtyMilliForProduct,
} from '../src/features/voice/match'
import { encodeWavPcm16 } from '../src/features/voice/wav'

const product = (over: Partial<ProductCache> = {}): ProductCache => ({
  id: 'p-rice',
  shop_id: 'shop-1',
  name: 'Sona Masoori Rice',
  name_ta: 'அரிசி',
  aliases: ['arisi', 'rice'],
  unit: 'kg',
  sell_price: 5500,
  cost_price: 4800,
  stock_qty: 25,
  reorder_level: 5,
  cover_days: 7,
  barcode: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  deleted_at: null,
  syncedAt: '2026-01-01T00:00:00Z',
  ...over,
})

const sugar = product({
  id: 'p-sugar',
  name: 'Sugar',
  name_ta: 'சர்க்கரை',
  aliases: ['sarkkarai', 'sugar'],
  unit: 'kg',
  sell_price: 4500,
})

const parle = product({
  id: 'p-parle',
  name: 'Parle-G Biscuit',
  name_ta: null,
  aliases: ['parle g', 'parle-g', 'biscuit'],
  unit: 'pack',
  sell_price: 1000,
})

const catalog = [product(), sugar, parle]
const fuse = createProductFuse(catalog)

describe('candidatesFor', () => {
  it('matches English aliases', () => {
    expect(candidatesFor(fuse, 'arisi')[0]?.product.id).toBe('p-rice')
    expect(candidatesFor(fuse, 'sugar')[0]?.product.id).toBe('p-sugar')
  })

  it('matches Tamil product names', () => {
    expect(candidatesFor(fuse, 'அரிசி')[0]?.product.id).toBe('p-rice')
    expect(candidatesFor(fuse, 'சர்க்கரை')[0]?.product.id).toBe('p-sugar')
  })

  it('matches hyphenated brand names spoken with a space', () => {
    expect(candidatesFor(fuse, 'parle g')[0]?.product.id).toBe('p-parle')
  })

  it('returns at most the top match plus two alternatives', () => {
    const results = candidatesFor(fuse, 'rice')
    expect(results.length).toBeLessThanOrEqual(3)
  })
})

describe('normalizeUnit', () => {
  it('understands English and Tamil unit words', () => {
    expect(normalizeUnit('kilo')).toBe('kg')
    expect(normalizeUnit('கிலோ')).toBe('kg')
    expect(normalizeUnit('grams')).toBe('g')
    expect(normalizeUnit('கிராம்')).toBe('g')
    expect(normalizeUnit('litre')).toBe('l')
    expect(normalizeUnit('மில்லி')).toBe('ml')
    expect(normalizeUnit('packet')).toBe('pack')
    expect(normalizeUnit('பாக்கெட்')).toBe('pack')
    expect(normalizeUnit('something')).toBe('pcs')
  })
})

describe('qtyMilliForProduct', () => {
  it('keeps kilo quantities in thousandths', () => {
    expect(qtyMilliForProduct(2, 'kilo', 'kg')).toBe(2000)
    expect(qtyMilliForProduct(0.5, 'kg', 'kg')).toBe(500)
    expect(qtyMilliForProduct(2, 'கிலோ', 'kg')).toBe(2000)
  })

  it('converts grams to kg when the product is sold in kg', () => {
    expect(qtyMilliForProduct(500, 'g', 'kg')).toBe(500)
  })

  it('converts kg to grams for gram products', () => {
    expect(qtyMilliForProduct(0.5, 'kg', 'g')).toBe(500000)
  })

  it('converts litres and millilitres', () => {
    expect(qtyMilliForProduct(1.5, 'litre', 'l')).toBe(1500)
    expect(qtyMilliForProduct(250, 'ml', 'l')).toBe(250)
  })

  it('rounds counted units to whole pieces, minimum one', () => {
    expect(qtyMilliForProduct(1.5, 'pcs', 'pcs')).toBe(2000)
    expect(qtyMilliForProduct(0.2, 'pcs', 'pcs')).toBe(1000)
  })

  it('falls back to one unit for invalid quantities', () => {
    expect(qtyMilliForProduct(0, 'kg', 'kg')).toBe(1000)
    expect(qtyMilliForProduct(Number.NaN, 'kg', 'kg')).toBe(1000)
  })
})

describe('buildDraftRows', () => {
  it('auto-picks a confident, close match and keeps the spoken quantity', () => {
    const rows = buildDraftRows(
      [{ spoken_name: 'arisi', qty: 2, unit: 'kilo', confidence: 0.92 }],
      fuse,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].productId).toBe('p-rice')
    expect(rows[0].qtyMilli).toBe(2000)
    expect(rows[0].candidates.length).toBeGreaterThan(0)
  })

  it('never auto-picks low-confidence transcriptions', () => {
    const rows = buildDraftRows(
      [{ spoken_name: 'arisi', qty: 2, unit: 'kilo', confidence: 0.35 }],
      fuse,
    )
    expect(rows[0].productId).toBeNull()
  })

  it('leaves unmatched items for the owner to pick', () => {
    const rows = buildDraftRows(
      [{ spoken_name: 'wall paint', qty: 1, unit: 'pcs', confidence: 0.95 }],
      fuse,
    )
    expect(rows[0].productId).toBeNull()
  })

  it('keeps an editable quantity per spoken item', () => {
    const rows = buildDraftRows(
      [
        { spoken_name: 'sugar', qty: 1, unit: 'kg', confidence: 0.9 },
        { spoken_name: 'parle g', qty: 3, unit: 'pack', confidence: 0.9 },
      ],
      fuse,
    )
    expect(rows.map((row) => row.qtyMilli)).toEqual([1000, 3000])
  })
})

describe('productHasSpokenName', () => {
  it('recognises existing names and aliases case-insensitively', () => {
    expect(productHasSpokenName(product(), 'Arisi')).toBe(true)
    expect(productHasSpokenName(product(), 'அரிசி')).toBe(true)
    expect(productHasSpokenName(product(), 'arasu')).toBe(false)
  })
})

describe('encodeWavPcm16', () => {
  it('writes a mono 16-bit 16 kHz WAV header and samples', () => {
    const bytes = encodeWavPcm16(new Float32Array([0, 1, -1]), 16000)
    const view = new DataView(bytes.buffer)
    const ascii = (start: number) => String.fromCharCode(...bytes.slice(start, start + 4))

    expect(bytes.length).toBe(44 + 6)
    expect(ascii(0)).toBe('RIFF')
    expect(ascii(8)).toBe('WAVE')
    expect(ascii(36)).toBe('data')
    expect(view.getUint16(22, true)).toBe(1)
    expect(view.getUint32(24, true)).toBe(16000)
    expect(view.getUint16(34, true)).toBe(16)
    expect(view.getUint32(40, true)).toBe(6)
    expect(view.getInt16(44, true)).toBe(0)
    expect(view.getInt16(46, true)).toBe(32767)
    expect(view.getInt16(48, true)).toBe(-32768)
  })
})

describe('mergeCartLines', () => {
  it('adds new voice lines with catalog prices and units', () => {
    const merged = mergeCartLines([], [{ product: sugar, qtyMilli: 1000 }])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({
      productId: 'p-sugar',
      unit: 'kg',
      unitPricePaise: 4500,
      qtyMilli: 1000,
    })
  })

  it('adds quantities when the product is already in the cart', () => {
    const first = mergeCartLines([], [{ product: sugar, qtyMilli: 1000 }])
    const merged = mergeCartLines(first, [{ product: sugar, qtyMilli: 500 }])
    expect(merged).toHaveLength(1)
    expect(merged[0].qtyMilli).toBe(1500)
  })
})
