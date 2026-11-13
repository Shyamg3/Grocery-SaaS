import { supabase } from './supabase'

export interface Customer {
  id: string
  shop_id: string
  name: string
  phone: string | null
}

interface CustomerRow {
  id: string
  shop_id: string
  name: string
  phone: string | null
}

export async function fetchCustomers(shopId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, shop_id, name, phone')
    .eq('shop_id', shopId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as CustomerRow[]
}

export async function createCustomer(shopId: string, name: string, phone: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({ shop_id: shopId, name, phone: phone.trim() === '' ? null : phone.trim() })
    .select('id, shop_id, name, phone')
    .single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('customer insert returned no row')
  return data as CustomerRow
}
