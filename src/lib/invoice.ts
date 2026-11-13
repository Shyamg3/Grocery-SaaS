import type { BillItemSnapshot } from '../db/db'
import { formatQty } from './billing'
import { formatMoney } from './money'
import type { Lang } from './i18n'
import type { Unit } from './products'

const UNIT_LABELS: Record<Lang, Record<Unit, string>> = {
  ta: { kg: 'கிலோ', g: 'கிராம்', l: 'லிட்டர்', ml: 'மில்லி', pcs: 'எண்', pack: 'பேக்' },
  en: { kg: 'kg', g: 'g', l: 'l', ml: 'ml', pcs: 'pcs', pack: 'pack' },
}

export interface InvoiceTextBill {
  shopName: string
  billNo: number | null
  createdAt: string
  items: BillItemSnapshot[]
  subtotalPaise: number
  discountPaise: number
  totalPaise: number
  paymentLabel: string
  customerName?: string | null
}

export interface InvoiceTextLabels {
  billNo: string
  date: string
  subtotal: string
  discount: string
  total: string
  payment: string
  customer: string
  pending: string
}

function itemName(item: BillItemSnapshot, lang: Lang): string {
  return lang === 'ta' && item.nameTa ? item.nameTa : item.name
}

/** Plain-text bill summary used for WhatsApp sharing. */
export function buildBillText(bill: InvoiceTextBill, labels: InvoiceTextLabels, lang: Lang): string {
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN'
  const date = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(bill.createdAt))

  const number = bill.billNo === null ? labels.pending : `#${bill.billNo}`
  const lines: string[] = [bill.shopName, `${labels.billNo}: ${number}`, `${labels.date}: ${date}`, '']

  for (const item of bill.items) {
    const qty = `${formatQty(item.qtyMilli)} ${UNIT_LABELS[lang][item.unit]}`
    lines.push(`${itemName(item, lang)} — ${qty} × ${formatMoney(item.unitPricePaise)} = ${formatMoney(item.lineTotalPaise)}`)
  }

  lines.push('', `${labels.subtotal}: ${formatMoney(bill.subtotalPaise)}`)
  if (bill.discountPaise > 0) lines.push(`${labels.discount}: -${formatMoney(bill.discountPaise)}`)
  lines.push(`${labels.total}: ${formatMoney(bill.totalPaise)}`)
  lines.push(`${labels.payment}: ${bill.paymentLabel}`)
  if (bill.customerName) lines.push(`${labels.customer}: ${bill.customerName}`)

  return lines.join('\n')
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
