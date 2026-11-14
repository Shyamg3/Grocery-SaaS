import Fuse from 'fuse.js'
import type { ProductCache } from '../../db/db'
import type { Unit } from '../../lib/products'

/** Item as returned by the voice-parse Edge Function. */
export interface VoiceParseItem {
  spoken_name: string
  qty: number
  unit: string
  confidence: number
}

export interface MatchCandidate {
  product: ProductCache
  /** Fuse score: 0 = exact, 1 = worst. */
  score: number
}

export interface DraftRow {
  key: string
  spokenName: string
  spokenQty: number
  spokenUnit: string
  confidence: number
  qtyMilli: number
  productId: string | null
  candidates: MatchCandidate[]
}

/** Auto-pick needs both a close catalog match and a confident transcription. */
export const AUTO_MATCH_MAX_SCORE = 0.35
export const AUTO_MATCH_MIN_CONFIDENCE = 0.6
export const MAX_CANDIDATES = 3
const MAX_QTY_MILLI = 999_999_000

const UNIT_WORDS: Record<Unit, string[]> = {
  kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'கிலோ', 'கிலோகிராம்'],
  g: ['g', 'gm', 'gms', 'gram', 'grams', 'கிராம்'],
  l: ['l', 'lt', 'litre', 'litres', 'liter', 'liters', 'லிட்டர்'],
  ml: ['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters', 'மில்லி'],
  pcs: ['pcs', 'pc', 'piece', 'pieces', 'nos', 'no', 'number', 'எண்ணிக்கை'],
  pack: ['pack', 'packs', 'packet', 'packets', 'pkt', 'பாக்கெட்'],
}

const MASS_UNITS: readonly Unit[] = ['kg', 'g']
const VOLUME_UNITS: readonly Unit[] = ['l', 'ml']

export function normalizeProductText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()\-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when the spoken word is already one of the product's names/aliases. */
export function productHasSpokenName(product: ProductCache, spokenName: string): boolean {
  const target = normalizeProductText(spokenName)
  if (target === '') return true
  return [product.name, product.name_ta ?? '', ...product.aliases].some(
    (name) => normalizeProductText(name) === target,
  )
}

export function normalizeUnit(raw: string): Unit {
  const key = raw.trim().toLowerCase()
  for (const unit of Object.keys(UNIT_WORDS) as Unit[]) {
    if (UNIT_WORDS[unit].includes(key)) return unit
  }
  return 'pcs'
}

/**
 * Quantity in thousandths of the product's unit.
 * "2 kilo" on a kg product = 2000; 500 g on a kg product = 500; a g product
 * gets 500 000. Counted units are rounded to whole pieces (minimum 1).
 */
export function qtyMilliForProduct(qty: number, spokenUnit: string, productUnit: Unit): number {
  if (!Number.isFinite(qty) || qty <= 0) return 1000
  const spoken = normalizeUnit(spokenUnit)
  let value = qty

  if (MASS_UNITS.includes(spoken) && MASS_UNITS.includes(productUnit)) {
    const grams = spoken === 'kg' ? qty * 1000 : qty
    value = productUnit === 'kg' ? grams / 1000 : grams
  } else if (VOLUME_UNITS.includes(spoken) && VOLUME_UNITS.includes(productUnit)) {
    const millilitres = spoken === 'l' ? qty * 1000 : qty
    value = productUnit === 'l' ? millilitres / 1000 : millilitres
  }

  if (productUnit === 'pcs' || productUnit === 'pack') {
    return Math.max(1, Math.round(value)) * 1000
  }
  return Math.min(Math.max(1, Math.round(value * 1000)), MAX_QTY_MILLI)
}

export function createProductFuse(products: ProductCache[]): Fuse<ProductCache> {
  return new Fuse(products, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'name_ta', weight: 0.3 },
      { name: 'aliases', weight: 0.2 },
    ],
    includeScore: true,
    ignoreLocation: true,
    ignoreDiacritics: true,
    threshold: 0.6,
    minMatchCharLength: 2,
  })
}

export function candidatesFor(fuse: Fuse<ProductCache>, spokenName: string): MatchCandidate[] {
  if (spokenName.trim() === '') return []
  return fuse
    .search(spokenName, { limit: MAX_CANDIDATES })
    .map((result) => ({ product: result.item, score: result.score ?? 1 }))
}

/** One editable draft row per spoken item; low confidence always needs a pick. */
export function buildDraftRows(items: VoiceParseItem[], fuse: Fuse<ProductCache>): DraftRow[] {
  return items.map((item, index) => {
    const candidates = candidatesFor(fuse, item.spoken_name)
    const top = candidates[0]
    const autoPick =
      top && item.confidence >= AUTO_MATCH_MIN_CONFIDENCE && top.score <= AUTO_MATCH_MAX_SCORE
        ? top
        : null
    const unit = autoPick ? autoPick.product.unit : normalizeUnit(item.unit)

    return {
      key: `voice-${index}`,
      spokenName: item.spoken_name,
      spokenQty: item.qty,
      spokenUnit: item.unit,
      confidence: item.confidence,
      qtyMilli: qtyMilliForProduct(item.qty, item.unit, unit),
      productId: autoPick ? autoPick.product.id : null,
      candidates,
    }
  })
}
