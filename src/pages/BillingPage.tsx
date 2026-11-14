import { liveQuery } from 'dexie'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BillsHistory from '../components/billing/BillsHistory'
import CustomerSheet from '../components/billing/CustomerSheet'
import NumberPad from '../components/billing/NumberPad'
import ConfirmBar from '../components/ui/ConfirmBar'
import EmptyState from '../components/ui/EmptyState'
import ListRow from '../components/ui/ListRow'
import OfflineBadge from '../components/ui/OfflineBadge'
import PillTabs from '../components/ui/PillTabs'
import Toast from '../components/ui/Toast'
import T from '../components/ui/T'
import { BillIcon, CheckIcon, MicIcon, PlusIcon, SpeakerIcon } from '../components/ui/icons'
import { db, type CustomerCache, type PaymentMode, type ProductCache } from '../db/db'
import { enqueueBill } from '../db/sync'
import VoiceBillingSheet from '../features/voice/VoiceBillingSheet'
import { useShop } from '../features/shop/ShopProvider'
import {
  addProductToLines,
  clampDiscount,
  formatQty,
  lineTotalPaise,
  mergeCartLines,
  parseQty,
  qtyFromMilli,
  subtotalPaise,
  type CartLine,
} from '../lib/billing'
import { bi, t, type StringKey } from '../lib/i18n'
import { formatMoney, rupeesFromPaise, toPaise } from '../lib/money'
import type { Unit } from '../lib/products'

const UNIT_KEYS: Record<Unit, StringKey> = {
  kg: 'unit.kg',
  g: 'unit.g',
  l: 'unit.l',
  ml: 'unit.ml',
  pcs: 'unit.pcs',
  pack: 'unit.pack',
}

const PAYMENT_ITEMS: { id: PaymentMode; labelKey: StringKey }[] = [
  { id: 'cash', labelKey: 'payment.cash' },
  { id: 'upi', labelKey: 'payment.upi' },
  { id: 'card', labelKey: 'payment.card' },
  { id: 'credit', labelKey: 'payment.credit' },
]

const BILL_TABS: { id: string; labelKey: StringKey }[] = [
  { id: 'new', labelKey: 'billing.tabNew' },
  { id: 'history', labelKey: 'billing.tabHistory' },
]

type PadTarget = { kind: 'qty'; productId: string } | { kind: 'discount' }

function matchesProduct(product: ProductCache, query: string): boolean {
  return (
    product.name.toLowerCase().includes(query) ||
    (product.name_ta?.toLowerCase().includes(query) ?? false) ||
    product.aliases.some((alias) => alias.toLowerCase().includes(query))
  )
}

export default function BillingPage({ tab = 'new' }: { tab?: 'new' | 'history' }) {
  const { shop } = useShop()
  const shopId = shop?.id ?? null
  const navigate = useNavigate()
  const view = tab

  const [products, setProducts] = useState<ProductCache[]>([])
  const [customers, setCustomers] = useState<CustomerCache[]>([])
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)

  const [lines, setLines] = useState<CartLine[]>([])
  const [search, setSearch] = useState('')
  const [discountPaise, setDiscountPaise] = useState(0)
  const [payment, setPayment] = useState<PaymentMode>('cash')
  const [customer, setCustomer] = useState<CustomerCache | null>(null)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [spokenTranscript, setSpokenTranscript] = useState<string | null>(null)
  const [pad, setPad] = useState<PadTarget | null>(null)
  const [padValue, setPadValue] = useState('')
  const [padError, setPadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [taVoice, setTaVoice] = useState<SpeechSynthesisVoice | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (!shopId) return
    const productSub = liveQuery(() =>
      db.products.where('shop_id').equals(shopId).toArray(),
    ).subscribe({
      next: setProducts,
      error: () => setProducts([]),
    })
    const customerSub = liveQuery(() =>
      db.customers.where('shop_id').equals(shopId).toArray(),
    ).subscribe({
      next: setCustomers,
      error: () => setCustomers([]),
    })
    const pendingSub = liveQuery(() =>
      db.outbox.where('status').equals('pending').count(),
    ).subscribe({
      next: setPending,
      error: () => setPending(0),
    })
    return () => {
      productSub.unsubscribe()
      customerSub.unsubscribe()
      pendingSub.unsubscribe()
    }
  }, [shopId])

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => {
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('ta'))
      setTaVoice(voice ?? null)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  function showToast(message: string, tone: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, tone })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sorted = [...products].filter((p) => p.is_active).sort((a, b) => a.name.localeCompare(b.name))
    if (q === '') return sorted.slice(0, 6)
    return sorted.filter((p) => matchesProduct(p, q)).slice(0, 20)
  }, [products, search])

  const subtotal = subtotalPaise(lines)
  const discount = clampDiscount(discountPaise, subtotal)
  const total = subtotal - discount
  const creditBlocked = payment === 'credit' && customer === null
  const activeLine = pad?.kind === 'qty' ? lines.find((l) => l.productId === pad.productId) : undefined
  const padAllowDecimal = pad?.kind === 'discount' ? true : activeLine ? activeLine.unit === 'kg' || activeLine.unit === 'l' : false
  const transcript = lines.map((l) => `${l.nameTa ?? l.name} ${formatQty(l.qtyMilli)}`).join(' · ')

  function addProduct(product: ProductCache) {
    setLines((prev) => addProductToLines(prev, product))
  }

  function openQty(line: CartLine) {
    setPad({ kind: 'qty', productId: line.productId })
    setPadValue(formatQty(line.qtyMilli))
    setPadError(null)
  }

  function openDiscount() {
    setPad({ kind: 'discount' })
    setPadValue(discountPaise > 0 ? rupeesFromPaise(discountPaise) : '')
    setPadError(null)
  }

  function closePad() {
    setPad(null)
    setPadError(null)
  }

  function commitPad() {
    if (!pad) return
    if (pad.kind === 'qty') {
      const line = lines.find((l) => l.productId === pad.productId)
      if (!line) {
        closePad()
        return
      }
      const milli = parseQty(padValue, line.unit)
      if (milli === null) {
        setPadError(t('billing.qtyInvalid'))
        return
      }
      setLines((prev) => prev.map((l) => (l.productId === line.productId ? { ...l, qtyMilli: milli } : l)))
      closePad()
      return
    }
    const paise = padValue.trim() === '' ? 0 : toPaise(padValue)
    if (paise === null) {
      setPadError(t('billing.discountInvalid'))
      return
    }
    setDiscountPaise(clampDiscount(paise, subtotal))
    closePad()
  }

  function changePayment(id: string) {
    const mode = id as PaymentMode
    setPayment(mode)
    if (mode !== 'credit') setCustomer(null)
  }

  function hearBack() {
    if (!taVoice) return
    const spoken = lines.map((l) => `${l.nameTa ?? l.name} ${formatQty(l.qtyMilli)} ${bi(UNIT_KEYS[l.unit]).ta}`)
    const utterance = new SpeechSynthesisUtterance(
      `${spoken.join(', ')}. ${bi('billing.total').ta} ${formatMoney(total)}`,
    )
    utterance.lang = 'ta-IN'
    utterance.voice = taVoice
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  async function handleSave() {
    if (!shopId || lines.length === 0 || savingRef.current || creditBlocked) return
    savingRef.current = true
    setSaving(true)
    try {
      const id = crypto.randomUUID()
      const now = new Date()
      const items = lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        nameTa: l.nameTa,
        unit: l.unit,
        qtyMilli: l.qtyMilli,
        unitPricePaise: l.unitPricePaise,
        lineTotalPaise: lineTotalPaise(l.unitPricePaise, l.qtyMilli),
      }))
      // write the local snapshot first so a fast online sync can mark it synced
      await db.localBills.put({
        id,
        shopId,
        createdAt: now.toISOString(),
        totalPaise: total,
        itemCount: lines.length,
        synced: false,
        billNo: null,
        status: 'active',
        subtotalPaise: subtotal,
        discountPaise: discount,
        payment,
        customerName: customer?.name ?? null,
        source: 'manual',
        items,
      })
      try {
        await enqueueBill(shopId, {
          id,
          items: lines.map((l) => ({
            productId: l.productId,
            qty: qtyFromMilli(l.qtyMilli),
            unitPricePaise: l.unitPricePaise,
          })),
          payment,
          discountPaise: discount,
          customerId: customer?.id ?? null,
          source: 'manual',
        })
      } catch (err) {
        await db.localBills.delete(id)
        throw err
      }
      setLines([])
      setDiscountPaise(0)
      setPayment('cash')
      setCustomer(null)
      setSearch('')
      navigate(`/bills/${id}`)
    } catch {
      showToast(t('billing.saveError'), 'error')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div className="w-full px-4 py-4 md:px-6 md:py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">
            <T {...bi('billing.emptyTitle')} />
          </h1>
          <p className="text-xs text-ink-muted">
            {shop?.name}
          </p>
        </div>
        <OfflineBadge online={online} pending={pending} />
      </div>

      <div className="mb-4">
        <PillTabs
          items={BILL_TABS}
          value={view}
          onChange={(id) => navigate(id === 'history' ? '/bills' : '/billing')}
        />
      </div>

      {view === 'history' ? (
        <BillsHistory onNewBill={() => navigate('/billing')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Catalog & Search (Desktop: Left 5 columns; Mobile: below voice/items or inline) */}
          <div className="order-2 md:order-1 md:col-span-5 space-y-3">
            <div className="rounded-card border border-line bg-surface p-4 shadow-card">
              <div className="mb-2">
                <T className="text-sm font-semibold text-ink" {...bi('billing.tapToAdd')} />
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('products.searchPlaceholder')}
                className="min-h-[48px] w-full rounded-control border border-line bg-page px-3.5 text-base focus:border-brand focus:outline-none"
              />

              {products.length === 0 ? (
                <p className="mt-3 rounded-control bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
                  {t('billing.noCachedProducts')}
                </p>
              ) : visibleProducts.length === 0 ? (
                <p className="mt-4 text-center text-sm text-ink-muted">{t('products.noResults')}</p>
              ) : (
                <ul className="mt-3 max-h-[360px] md:max-h-[520px] overflow-y-auto divide-y divide-line rounded-control border border-line">
                  {visibleProducts.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => addProduct(product)}
                        className="flex min-h-[56px] w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-brand-tint active:bg-brand-soft"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">
                            <T ta={product.name_ta ?? product.name} en={product.name} />
                          </span>
                          <span className="block text-xs text-ink-muted">
                            {formatMoney(product.sell_price)} / {t(UNIT_KEYS[product.unit])} · {product.stock_qty}{' '}
                            {t(UNIT_KEYS[product.unit])}
                          </span>
                        </span>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                          <PlusIcon className="h-4 w-4" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Current Bill, Items, Payment, Checkout (Desktop: Right 7 columns; Mobile: Order 1) */}
          <div className="order-1 md:order-2 md:col-span-7 space-y-4">
            {/* Voice Transcription Bubble (matching Figma Screen 02) */}
            <div className="rounded-card border border-brand-soft bg-brand-tint p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-brand">
                  <CheckIcon className="h-4 w-4" />
                  <T {...bi('billing.heard')} />
                </span>
                {lines.length > 0 && (
                  <span className="text-xs font-medium tabular-nums text-ink-muted">
                    {t('billing.heardSummary', { n: lines.length })}
                  </span>
                )}
              </div>
              <p className={`mt-2 text-base font-semibold leading-snug ${lines.length > 0 ? 'text-ink' : 'text-ink-muted'}`}>
                {spokenTranscript ? `“${spokenTranscript}”` : lines.length > 0 ? transcript : t('billing.heardEmpty')}
              </p>
              {lines.length > 0 && taVoice && (
                <button
                  type="button"
                  onClick={hearBack}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                >
                  <SpeakerIcon className="h-4 w-4" />
                  <T {...bi('billing.hearBack')} />
                </button>
              )}
            </div>

            {/* Bill Items List */}
            <div>
              {lines.length === 0 ? (
                <EmptyState
                  titleKey="billing.emptyTitle"
                  bodyKey="billing.emptyBody"
                  icon={<BillIcon className="h-6 w-6" />}
                />
              ) : (
                <div className="rounded-card border border-line bg-surface px-4 shadow-card">
                  <div className="flex items-center justify-between border-b border-line py-3">
                    <span className="text-sm font-bold text-ink">
                      {t('billing.heardSummary', { n: lines.length })}
                    </span>
                    <span className="text-xs text-ink-muted">
                      <T {...bi('billing.editHint')} />
                    </span>
                  </div>
                  {lines.map((line) => (
                    <ListRow
                      key={line.productId}
                      title={
                        <span className="block truncate text-base font-semibold text-ink">
                          <T ta={line.nameTa ?? line.name} en={line.name} />
                        </span>
                      }
                      subtitle={
                        <span className="text-xs text-ink-muted">
                          {formatQty(line.qtyMilli)} {t(UNIT_KEYS[line.unit])} × {formatMoney(line.unitPricePaise)}
                        </span>
                      }
                      value={formatMoney(lineTotalPaise(line.unitPricePaise, line.qtyMilli))}
                      onEdit={() => openQty(line)}
                      onRemove={() => setLines((prev) => prev.filter((l) => l.productId !== line.productId))}
                      removeLabel={t('billing.removeLine')}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Speak To Add More CTA Button (Figma Screen 02) */}
            <button
              type="button"
              onClick={() => setVoiceOpen(true)}
              className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-control border border-brand bg-surface text-base font-semibold text-brand shadow-xs transition-colors hover:bg-brand-tint active:bg-brand-soft"
            >
              <MicIcon className="h-5 w-5" />
              <T {...bi('billing.speakMore')} />
            </button>

            {/* Discount & Payment Controls */}
            <div className="space-y-3 rounded-card border border-line bg-surface p-4 shadow-card">
              <button
                type="button"
                onClick={openDiscount}
                className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-control bg-page px-3.5 text-left transition-colors hover:bg-brand-tint active:bg-brand-soft"
              >
                <T className="text-sm font-medium text-ink" {...bi('billing.discount')} />
                <span className={`text-sm font-semibold tabular-nums ${discount > 0 ? 'text-danger' : 'text-brand'}`}>
                  {discount > 0 ? `− ${formatMoney(discount)}` : t('billing.addDiscount')}
                </span>
              </button>

              <div>
                <div className="mb-1.5 px-1">
                  <T className="text-xs font-medium text-ink-muted" {...bi('billing.payment')} />
                </div>
                <PillTabs items={PAYMENT_ITEMS} value={payment} onChange={changePayment} />
              </div>

              {payment === 'credit' && (
                <button
                  type="button"
                  onClick={() => setCustomerOpen(true)}
                  className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-control border border-line px-3.5 text-left active:bg-brand-tint"
                >
                  <T className="text-sm font-medium" {...bi('billing.customerTitle')} />
                  <span className={`min-w-0 truncate text-sm font-semibold ${customer ? 'text-ink' : 'text-brand'}`}>
                    {customer ? customer.name : t('billing.chooseCustomer')}
                  </span>
                </button>
              )}
              {creditBlocked && (
                <p className="rounded-control bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
                  {t('billing.creditNeedsCustomer')}
                </p>
              )}
            </div>

            {/* Confirm & Save Button */}
            <ConfirmBar
              floating
              labelKey="billing.saveBill"
              hintKey="billing.voice.confirmHint"
              onClick={handleSave}
              disabled={lines.length === 0 || saving || creditBlocked}
              value={formatMoney(total)}
              valueLabel={`${bi('billing.total').ta} / ${bi('billing.total').en}`}
            />
          </div>
        </div>
      )}

      <NumberPad
        open={pad !== null}
        title={pad?.kind === 'discount' ? t('billing.discount') : t('billing.qty')}
        value={padValue}
        allowDecimal={padAllowDecimal}
        maxDecimals={pad?.kind === 'discount' ? 2 : 3}
        suffix={pad?.kind === 'discount' ? '₹' : activeLine ? t(UNIT_KEYS[activeLine.unit]) : undefined}
        error={padError}
        doneLabel={t('common.done')}
        onChange={setPadValue}
        onDone={commitPad}
        onClose={closePad}
      />

      {shopId && (
        <CustomerSheet
          open={customerOpen}
          shopId={shopId}
          customers={customers}
          selectedId={customer?.id ?? null}
          online={online}
          onSelect={(next) => {
            setCustomer(next)
            setCustomerOpen(false)
          }}
          onCreated={(next) => {
            setCustomer(next)
            setCustomerOpen(false)
            showToast(t('billing.customerAdded'))
          }}
          onClose={() => setCustomerOpen(false)}
        />
      )}

      {shopId && (
        <VoiceBillingSheet
          open={voiceOpen}
          shopId={shopId}
          products={products}
          online={online}
          onAdd={(items, transcriptText) => {
            setLines((prev) => mergeCartLines(prev, items))
            if (transcriptText) setSpokenTranscript(transcriptText)
          }}
          onClose={() => setVoiceOpen(false)}
          onToast={showToast}
        />
      )}

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        tone={toast?.tone}
        onDismiss={() => setToast(null)}
      />
    </div>
  )
}
