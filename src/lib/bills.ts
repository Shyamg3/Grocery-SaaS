import { db } from '../db/db'
import { supabase } from './supabase'

/** Voids a synced bill on the server (stock and credit are reversed) and marks the local copy. */
export async function voidBill(billId: string): Promise<void> {
  const { error } = await supabase.rpc('void_bill', { p_bill_id: billId })
  if (error) throw error
  await db.localBills.update(billId, { status: 'void' })
}

export function needsDatabaseUpdate(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? '')
}
