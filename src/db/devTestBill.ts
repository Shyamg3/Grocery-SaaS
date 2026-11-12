import { db } from './db'
import { enqueueBill, pullProducts } from './sync'

// Dev-only helper so the offline sync flow can be exercised before the Billing UI exists.
export async function enqueueTestBill(shopId: string): Promise<string> {
  let products = await db.products.toArray()
  if (products.length === 0) {
    await pullProducts(shopId)
    products = await db.products.toArray()
  }
  products.sort((a, b) => a.name.localeCompare(b.name))
  if (products.length === 0) throw new Error('no products: add one first')
  return enqueueBill(shopId, {
    items: products.slice(0, 2).map((p) => ({ productId: p.id, qty: 1, unitPricePaise: p.sell_price })),
    payment: 'cash',
    source: 'test',
  })
}
