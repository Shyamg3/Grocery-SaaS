import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Toast from '../components/ui/Toast'
import T from '../components/ui/T'
import { BackIcon, PrintIcon, ShareIcon } from '../components/ui/icons'
import { db, type LocalBill, type PaymentMode } from '../db/db'
import { useShop } from '../features/shop/ShopProvider'
import { needsDatabaseUpdate, voidBill } from '../lib/bills'
import { formatQty } from '../lib/billing'
import { buildBillText, buildWhatsAppUrl } from '../lib/invoice'
import { t, type StringKey } from '../lib/i18n'
import { formatMoney } from '../lib/money'
import { useLangMode } from '../lib/useLanguage'
import type { Unit } from '../lib/products'

const UNIT_KEYS: Record<Unit, StringKey> = {
  kg: 'unit.kg',
  g: 'unit.g',
  l: 'unit.l',
  ml: 'unit.ml',
  pcs: 'unit.pcs',
  pack: 'unit.pack',
}

const PAYMENT_KEYS: Record<PaymentMode, StringKey> = {
  cash: 'payment.cash',
  upi: 'payment.upi',
  card: 'payment.card',
  credit: 'payment.credit',
}

const WIDTH_KEY = 'app.receiptWidth'

function readWidth(): 58 | 80 {
  try {
    return localStorage.getItem(WIDTH_KEY) === '58' ? 58 : 80
  } catch {
    return 80
  }
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const { shop } = useShop()
  const mode = useLangMode()
  const lang = mode === 'en' ? 'en' : 'ta'

  const [bill, setBill] = useState<LocalBill | null | undefined>(undefined)
  const [width, setWidth] = useState<58 | 80>(readWidth)
  const [confirming, setConfirming] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!id) {
      setBill(null)
      return
    }
    const sub = liveQuery(() => db.localBills.get(id)).subscribe({
      next: (row) => setBill(row ?? null),
      error: () => setBill(null),
    })
    return () => sub.unsubscribe()
  }, [id])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  function changeWidth(next: 58 | 80) {
    setWidth(next)
    try {
      localStorage.setItem(WIDTH_KEY, String(next))
    } catch {
      // print width still applies for this visit
    }
  }

  async function handleVoid() {
    if (!bill) return
    if (!bill.synced) {
      setToast({ message: t('invoice.voidAfterSync'), tone: 'error' })
      return
    }
    if (!navigator.onLine) {
      setToast({ message: t('invoice.voidOffline'), tone: 'error' })
      return
    }
    setVoiding(true)
    try {
      await voidBill(bill.id)
      setConfirming(false)
      setToast({ message: t('invoice.voidDone'), tone: 'success' })
    } catch (err) {
      const error = err as { code?: string; message?: string }
      setToast({
        message: needsDatabaseUpdate(error) ? t('invoice.voidNeedsUpdate') : t('invoice.voidError'),
        tone: 'error',
      })
    } finally {
      setVoiding(false)
    }
  }

  if (bill === undefined) {
    return <div className="min-h-dvh bg-page p-4 text-ink-muted">{t('common.loading')}</div>
  }

  if (bill === null) {
    return (
      <div className="min-h-dvh bg-page px-4 py-10 text-center">
        <p className="text-base font-semibold text-ink">{t('invoice.notFound')}</p>
        <Link
          to="/bills"
          className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-control bg-brand px-5 text-base font-semibold text-white"
        >
          {t('invoice.backToBills')}
        </Link>
      </div>
    )
  }

  const items = bill.items ?? []
  const subtotal = bill.subtotalPaise ?? bill.totalPaise
  const discount = bill.discountPaise ?? 0
  const payment = bill.payment ?? 'cash'
  const pending = bill.billNo === null || bill.billNo === undefined
  const voided = bill.status === 'void'
  const dateLabel = new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(bill.createdAt))

  const waText = buildBillText(
    {
      shopName: shop?.name ?? '',
      billNo: bill.billNo ?? null,
      createdAt: bill.createdAt,
      items,
      subtotalPaise: subtotal,
      discountPaise: discount,
      totalPaise: bill.totalPaise,
      paymentLabel: t(PAYMENT_KEYS[payment]),
      customerName: bill.customerName ?? null,
    },
    {
      billNo: t('invoice.billNo'),
      date: t('invoice.date'),
      subtotal: t('invoice.subtotal'),
      discount: t('invoice.discount'),
      total: t('invoice.total'),
      payment: t('invoice.payment'),
      customer: t('invoice.customer'),
      pending: t('invoice.pending'),
    },
    lang,
  )

  return (
    <div className="min-h-dvh bg-page px-4 pt-4 pb-6 print:min-h-0 print:bg-white print:p-0">
      {/* Chrome rejects "58mm auto"; the receipt width itself drives the printed column. */}
      <style>{`@media print { @page { size: auto; margin: 4mm; } #invoice-receipt { width: ${width}mm; } }`}</style>

      <div className="flex items-center gap-2 print:hidden">
        <Link
          to="/bills"
          aria-label={t('common.back')}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink active:bg-brand-tint"
        >
          <BackIcon className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold text-ink">{t('invoice.title')}</h1>
      </div>

      {voided && (
        <p className="mt-3 rounded-control bg-danger-soft px-3 py-2 text-sm font-semibold text-danger print:hidden">
          {t('invoice.voidedBanner')}
        </p>
      )}

      <div
        id="invoice-receipt"
        className="mx-auto mt-3 w-full rounded-card border border-line bg-surface p-4 print:mt-0 print:rounded-none print:border-0 print:p-0 print:text-[11px] print:text-black"
      >
        <div className="text-center">
          <h2 className="text-lg font-bold leading-snug text-ink print:text-[14px]">{shop?.name}</h2>
          <p className="mt-1 text-sm text-ink-muted print:text-black">
            {t('invoice.billNo')}: {pending ? t('invoice.pending') : `#${bill.billNo}`}
          </p>
          {pending && <p className="mt-0.5 text-[13px] text-ink-muted print:text-black">{t('invoice.pendingNote')}</p>}
          <p className="mt-0.5 text-[13px] text-ink-muted print:text-black">{dateLabel}</p>
          {voided && <p className="mt-1 text-[13px] font-bold text-danger print:text-black">{t('bills.voidTag')}</p>}
        </div>

        <div className="mt-3 border-t border-dashed border-line pt-2 print:border-black">
          {items.length > 0 ? (
            <ul>
              {items.map((item, index) => (
                <li key={`${item.productId}-${index}`} className="border-b border-dashed border-line py-2 last:border-b-0 print:border-black">
                  <div className="flex items-start justify-between gap-2">
                    <T className="text-base font-semibold text-ink print:text-[11px]" ta={item.nameTa ?? item.name} en={item.name} />
                    <span className="shrink-0 text-base font-semibold tabular-nums text-ink print:text-[11px]">
                      {formatMoney(item.lineTotalPaise)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-muted print:text-black">
                    {formatQty(item.qtyMilli)} {t(UNIT_KEYS[item.unit])} × {formatMoney(item.unitPricePaise)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-2 text-sm text-ink-muted print:text-black">
              {t('bills.itemCount', { n: bill.itemCount })}
            </p>
          )}
        </div>

        <div className="mt-2 space-y-1 border-t border-dashed border-line pt-2 text-sm print:border-black">
          <div className="flex justify-between gap-2 text-ink-muted print:text-black">
            <span>{t('invoice.subtotal')}</span>
            <span className="tabular-nums">{formatMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between gap-2 text-ink-muted print:text-black">
              <span>{t('invoice.discount')}</span>
              <span className="tabular-nums">− {formatMoney(discount)}</span>
            </div>
          )}
          <div className="flex justify-between gap-2 text-lg font-bold text-ink print:text-[13px] print:text-black">
            <span>{t('invoice.total')}</span>
            <span className="tabular-nums">{formatMoney(bill.totalPaise)}</span>
          </div>
          <div className="flex justify-between gap-2 pt-1 text-ink-muted print:text-black">
            <span>{t('invoice.payment')}</span>
            <span>{t(PAYMENT_KEYS[payment])}</span>
          </div>
          {bill.customerName && (
            <div className="flex justify-between gap-2 text-ink-muted print:text-black">
              <span>{t('invoice.customer')}</span>
              <span>{bill.customerName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 print:hidden">
        <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-3 py-2">
          <span className="text-sm font-medium text-ink-muted">{t('invoice.receiptWidth')}</span>
          <div className="flex gap-1">
            {[58, 80].map((mm) => (
              <button
                key={mm}
                type="button"
                aria-pressed={width === mm}
                onClick={() => changeWidth(mm as 58 | 80)}
                className={`min-h-[48px] rounded-full px-4 text-sm font-semibold ${
                  width === mm ? 'bg-brand text-white' : 'bg-page text-ink-muted'
                }`}
              >
                {mm}mm
              </button>
            ))}
          </div>
        </div>

        <a
          href={buildWhatsAppUrl(waText)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-control bg-brand px-5 text-base font-semibold text-white active:bg-brand-dark"
        >
          <ShareIcon className="h-5 w-5" />
          {t('invoice.share')}
        </a>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-control border border-brand bg-surface px-3 text-base font-semibold text-brand active:bg-brand-tint"
          >
            <PrintIcon className="h-5 w-5" />
            {t('invoice.print')}
          </button>
          <Link
            to="/billing"
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-control bg-brand-soft px-3 text-base font-semibold text-brand active:bg-brand-tint"
          >
            {t('invoice.newBill')}
          </Link>
        </div>

        {!voided && (
          <div className="mt-4">
            {confirming ? (
              <div className="rounded-card border border-danger bg-danger-soft p-3">
                <p className="text-base font-semibold text-danger">{t('invoice.voidConfirmTitle')}</p>
                <p className="mt-1 text-sm leading-snug text-danger">{t('invoice.voidConfirmBody')}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={voiding}
                    className="min-h-[52px] rounded-control border border-line bg-surface text-base font-semibold text-ink"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleVoid()}
                    disabled={voiding}
                    className="min-h-[52px] rounded-control bg-danger text-base font-semibold text-white disabled:opacity-60"
                  >
                    {t('invoice.voidConfirm')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="min-h-[52px] w-full rounded-control text-base font-semibold text-danger active:bg-danger-soft"
              >
                {t('invoice.void')}
              </button>
            )}
          </div>
        )}
      </div>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        tone={toast?.tone}
        onDismiss={() => setToast(null)}
      />
    </div>
  )
}
