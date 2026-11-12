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
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }
}

export async function fetchProducts(shopId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, shop_id, name, name_ta, aliases, unit, sell_price, cost_price, stock_qty, reorder_level, is_active, created_at, updated_at, deleted_at',
    )
    .eq('shop_id', shopId)
    .is('deleted_at', null)
    .order('name')
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
}

export async function saveProduct(shopId: string, input: ProductInput, id?: string): Promise<void> {
  const values = {
    shop_id: shopId,
    name: input.name,
    name_ta: input.name_ta,
    aliases: input.aliases,
    unit: input.unit,
    sell_price: rupeesFromPaise(input.sellPricePaise),
    cost_price: input.costPricePaise === null ? null : rupeesFromPaise(input.costPricePaise),
    stock_qty: String(input.stockQty),
    reorder_level: String(input.reorderLevel),
  }
  const { error } = id
    ? await supabase.from('products').update(values).eq('id', id).eq('shop_id', shopId)
    : await supabase.from('products').insert(values)
  if (error) throw new Error(error.message)
}

export async function softDeleteProduct(shopId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('shop_id', shopId)
  if (error) throw new Error(error.message)
}
