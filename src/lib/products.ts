import { supabase } from './supabase'
import { rupeesFromPaise, toPaise } from './money'

export const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'pack'] as const
export type Unit = (typeof UNITS)[number]

export interface Product {
  id: string
  shop_id: string
  name: string
  name_ta: string | null
  aliases: string[]
  unit: Unit
  sell_price: number // paise
  cost_price: number | null // paise
  stock_qty: number
  reorder_level: number
  cover_days: number
  barcode: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface ProductRow {
  id: string
  shop_id: string
  name: string
  name_ta: string | null
  aliases: string[] | null
  unit: string
  sell_price: string
  cost_price: string | null
  stock_qty: string
  reorder_level: string
  cover_days?: number
  barcode: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    shop_id: row.shop_id,
    name: row.name,
    name_ta: row.name_ta,
    aliases: row.aliases ?? [],
    unit: (UNITS as readonly string[]).includes(row.unit) ? (row.unit as Unit) : 'pcs',
    sell_price: toPaise(row.sell_price) ?? 0,
    cost_price: row.cost_price === null ? null : (toPaise(row.cost_price) ?? 0),
    stock_qty: Number(row.stock_qty),
    reorder_level: Number(row.reorder_level),
    cover_days: row.cover_days ?? 7,
    barcode: row.barcode,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

const BASE_COLUMNS =
  'id, shop_id, name, name_ta, aliases, unit, sell_price, cost_price, stock_qty, reorder_level, barcode, is_active, created_at, updated_at, deleted_at'
// cover_days ships in migration 002; selecting it would break the whole catalog
// until that migration is applied, so retry without it on a missing-column error.
const FULL_COLUMNS = `${BASE_COLUMNS}, cover_days`

export async function fetchProducts(shopId: string): Promise<Product[]> {
  const query = (columns: string) =>
    supabase
      .from('products')
      .select(columns)
      .eq('shop_id', shopId)
      .is('deleted_at', null)
      .order('name')

  let { data, error } = await query(FULL_COLUMNS)
  if (error && /cover_days/.test(error.message)) {
    const fallback = await query(BASE_COLUMNS)
    data = fallback.data
    error = fallback.error
  }
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as ProductRow[]).map(rowToProduct)
}

export interface ProductInput {
  name: string
  name_ta: string | null
  aliases: string[]
  unit: Unit
  sellPricePaise: number
  costPricePaise: number | null
  stockQty: number
  reorderLevel: number
  coverDays: number
  barcode: string | null
}

export async function saveProduct(
  shopId: string,
  input: ProductInput,
  id?: string,
  previousCoverDays?: number,
): Promise<void> {
  const values: Record<string, unknown> = {
    shop_id: shopId,
    name: input.name,
    name_ta: input.name_ta,
    aliases: input.aliases,
    unit: input.unit,
    sell_price: rupeesFromPaise(input.sellPricePaise),
    cost_price: input.costPricePaise === null ? null : rupeesFromPaise(input.costPricePaise),
    stock_qty: String(input.stockQty),
    reorder_level: String(input.reorderLevel),
    barcode: input.barcode,
  }
  // Omit cover_days while it still has the database default, so product saves keep
  // working on a database where migration 002 has not been applied yet.
  const coverChanged = id
    ? previousCoverDays !== input.coverDays
    : input.coverDays !== 7
  if (coverChanged) values.cover_days = input.coverDays
  const { error } = id
    ? await supabase.from('products').update(values).eq('id', id).eq('shop_id', shopId)
    : await supabase.from('products').insert(values)
  if (error) throw new Error(error.message)
}

/** "Teach the app": append a spoken word as another name for a product. */
export async function addProductAlias(
  shopId: string,
  productId: string,
  spokenName: string,
): Promise<void> {
  const alias = spokenName.trim()
  if (alias === '') return

  const { data, error } = await supabase
    .from('products')
    .select('aliases')
    .eq('id', productId)
    .eq('shop_id', shopId)
    .single()
  if (error) throw new Error(error.message)

  const existing = ((data as { aliases: string[] | null } | null)?.aliases ?? [])
    .map((a) => a.trim())
    .filter((a) => a !== '')
  if (existing.some((a) => a.toLowerCase() === alias.toLowerCase())) return

  const { error: updateError } = await supabase
    .from('products')
    .update({ aliases: [...existing, alias] })
    .eq('id', productId)
    .eq('shop_id', shopId)
  if (updateError) throw new Error(updateError.message)
}

export async function softDeleteProduct(shopId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('shop_id', shopId)
  if (error) throw new Error(error.message)
}
