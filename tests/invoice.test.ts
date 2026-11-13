import { describe, expect, it } from 'vitest'
import type { BillItemSnapshot } from '../src/db/db'
import { buildBillText, buildWhatsAppUrl, type InvoiceTextLabels } from '../src/lib/invoice'

const items: BillItemSnapshot[] = [
  {
    productId: 'p1',
    name: 'Rice',
    nameTa: 'அரிசி',
    unit: 'kg',
    qtyMilli: 1500,
    unitPricePaise: 5599,
    lineTotalPaise: 8399,
  },
  {
    productId: 'p2',
    name: 'Milk',
    nameTa: 'பால்',
    unit: 'pack',
    qtyMilli: 2000,
    unitPricePaise: 3000,
    lineTotalPaise: 6000,
  },
]

const labels: InvoiceTextLabels = {
  billNo: 'Bill no.',
  date: 'Date',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'Total',
  payment: 'Payment',
  customer: 'Customer',
  pending: 'Pending',
}

const bill = {
  shopName: 'Sri Stores',
  billNo: 12,
  createdAt: '2026-11-13T10:30:00.000Z',
  items,
  subtotalPaise: 14399,
  discountPaise: 500,
  totalPaise: 13899,
  paymentLabel: 'UPI',
  customerName: 'Kumar',
}

describe('buildBillText', () => {
  it('renders the shop, bill number, items and totals in English', () => {
    const text = buildBillText(bill, labels, 'en')
    expect(text).toContain('Sri Stores')
    expect(text).toContain('Bill no.: #12')
    expect(text).toContain('Date:')
    expect(text).toContain('Rice — 1.5 kg × ₹55.99 = ₹83.99')
    expect(text).toContain('Milk — 2 pack × ₹30.00 = ₹60.00')
    expect(text).toContain('Subtotal: ₹143.99')
    expect(text).toContain('Discount: -₹5.00')
    expect(text).toContain('Total: ₹138.99')
    expect(text).toContain('Payment: UPI')
    expect(text).toContain('Customer: Kumar')
  })

  it('uses Tamil item names and units for Tamil bills', () => {
    const text = buildBillText(bill, labels, 'ta')
    expect(text).toContain('அரிசி — 1.5 கிலோ × ₹55.99 = ₹83.99')
    expect(text).toContain('பால் — 2 பேக் × ₹30.00 = ₹60.00')
  })

  it('shows Pending when the server has not numbered the bill yet', () => {
    const text = buildBillText({ ...bill, billNo: null }, labels, 'en')
    expect(text).toContain('Bill no.: Pending')
    expect(text).not.toContain('#12')
  })

  it('omits discount and customer lines when they are empty', () => {
    const text = buildBillText({ ...bill, discountPaise: 0, customerName: null }, labels, 'en')
    expect(text).not.toContain('Discount:')
    expect(text).not.toContain('Customer:')
  })
})

describe('buildWhatsAppUrl', () => {
  it('encodes the message for wa.me', () => {
    const text = buildBillText(bill, labels, 'en')
    const url = buildWhatsAppUrl(text)
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    expect(url).toContain('%0A')
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe(text)
  })
})
