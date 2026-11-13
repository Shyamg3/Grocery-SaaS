import { liveQuery } from 'dexie'
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import NumberPad from '../components/billing/NumberPad'
import ConfirmBar from '../components/ui/ConfirmBar'
import EmptyState from '../components/ui/EmptyState'
import PillTabs from '../components/ui/PillTabs'
import T from '../components/ui/T'
import Toast from '../components/ui/Toast'
import { MicIcon, PencilIcon, PlusIcon, ScanIcon, TrashIcon } from '../components/ui/icons'
import { db, type ProductCache } from '../db/db'
import { pullProducts } from '../db/sync'
import ScanSheet from '../features/stock/ScanSheet'
import SearchSheet from '../features/stock/SearchSheet'
import ShoppingListSheet from '../features/stock/ShoppingListSheet'
import VoiceSheet from '../features/stock/VoiceSheet'
import { voiceSupported } from '../features/stock/voice'
import { useShop } from '../features/shop/ShopProvider'
import { formatQty, parseQty } from '../lib/billing'
import { needsDatabaseUpdate } from '../lib/bills'
import { bi, t, type StringKey } from '../lib/i18n'
import { formatMoney, rupeesFromPaise, toPaise } from '../lib/money'
import type { Unit } from '../lib/products'
import {
  buildShoppingListText,
  daysLeftLabel,
  isLowStock,
  roundSuggestedQty,
  type ShoppingListEntry,
  type StockInsight,
} from '../lib/restock'
import { adjustStock, addStock, isNetworkMessage, refreshStockInsights } from '../lib/stock'
import { supabase } from '../lib/supabase'

type Tab = 'all' | 'low'

const TABS: { id: string; labelKey: StringKey }[] = [
  { id: 'all', labelKey: 'stock.tabAll' },
  { id: 'low', labelKey: 'stock.tabLow' },
]

interface DraftLine {
  productId: string
  name: string
  nameTa: string | null
  unit: Unit
  qtyMilli: number
  costPricePaise: number | null
}

interface PadState {
  kind: 'qty' | 'cost' | 'correct'
  productId: string
  unit: Unit
}

function trimNumber(value: number): string {
  return String(Number(value.toFixed(3)))
}

function StockAction({
  labelKey,
  Icon,
  onClick,
}: {
  labelKey: StringKey
  Icon: ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-card border border-line bg-surface px-1 text-[13px] font-semibold text-ink active:bg-brand-tint"
    >
      <Icon className="h-6 w-6 text-brand" />
      <span className="text-center leading-tight">{t(labelKey)}</span>
    </button>
  )
}

export default function StockPage() {
  const { shop } = useShop()
  const navigate = useNavigate()
  const shopId = shop?.id ?? null

  const [tab, setTab] = useState<Tab>('all')
  const [products, setProducts] = useState<ProductCache[]>([])
  const [insights, setInsights] = useState<StockInsight[]>([])
  const [search, setSearch] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [note, setNote] = useState('')
  const [correctProductId, setCorrectProductId] = useState<string | null>(null)
  const [correctQtyMilli, setCorrectQtyMilli] = useState<number | null>(null)
  const [correctNote, setCorrectNote] = useState('')
  const [correctError, setCorrectError] = useState<string | null>(null)
  const [pad, setPad] = useState<PadState | null>(null)
  const [padValue, setPadValue] = useState('')
  const [padError, setPadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [unknownCode, setUnknownCode] = useState<string | null>(null)
  const [listSheet, setListSheet] = useState<{ text: string; count: number } | null>(null)
  const [buildingList, setBuildingList] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!shopId) return
    const productSub = liveQuery(() => db.products.where('shop_id').equals(shopId).toArray()).subscribe({
      next: setProducts,
      error: () => setProducts([]),
    })
    const insightSub = liveQuery(() =>
      db.stockInsights.where('shopId').equals(shopId).toArray(),
    ).subscribe({
      next: setInsights,
      error: () => setInsights([]),
    })
    void pullProducts(shopId).catch(() => {})
    void refreshStockInsights(shopId).catch(() => {})
    const onOnline = () => {
      void refreshStockInsights(shopId).catch(() => {})
    }
    window.addEventListener('online', onOnline)
    return () => {
      productSub.unsubscribe()
      insightSub.unsubscribe()
      window.removeEventListener('online', onOnline)
    }
  }, [shopId])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const insightMap = useMemo(
    () => new Map(insights.map((row) => [row.productId, row])),
    [insights],
  )
  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active).sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = activeProducts.map((product) => ({
      product,
      insight: insightMap.get(product.id),
    }))
    const searched =
      q === ''
        ? rows
        : rows.filter(
            ({ product: p }) =>
              p.name.toLowerCase().includes(q) ||
              (p.name_ta?.toLowerCase().includes(q) ?? false) ||
              p.aliases.some((a) => a.toLowerCase().includes(q)),
          )
    if (tab === 'all') return searched
    return searched
      .filter(({ product, insight }) =>
        isLowStock(product.stock_qty, product.reorder_level, insight, product.cover_days),
      )
      .sort((a, b) => {
        const daysA = a.insight?.daysLeft ?? Number.POSITIVE_INFINITY
        const daysB = b.insight?.daysLeft ?? Number.POSITIVE_INFINITY
        return daysA - daysB
      })
  }, [activeProducts, insightMap, search, tab])

  const suggestions = useMemo(
    () =>
      activeProducts.flatMap((product) => {
        const qty = roundSuggestedQty(insightMap.get(product.id)?.suggestedQty ?? 0, product.unit)
        return qty > 0 ? [{ product, qty }] : []
      }),
    [activeProducts, insightMap],
  )

  const correctProduct = correctProductId ? (productById.get(correctProductId) ?? null) : null

  function showToast(message: string, tone: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, tone })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  function errorMessage(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err)
    if (needsDatabaseUpdate({ message }) || /does not exist|schema cache/i.test(message)) {
      return t('stock.needsUpdate')
    }
    if (isNetworkMessage(message)) return t('stock.offline')
    return t('stock.saveError')
  }

  function openPad(kind: PadState['kind'], product: ProductCache, value: string) {
    setPad({ kind, productId: product.id, unit: product.unit })
    setPadValue(value)
    setPadError(null)
  }

  function openQtyPad(product: ProductCache, preset?: string) {
    const existing = lines.find((line) => line.productId === product.id)
    openPad('qty', product, preset ?? (existing ? formatQty(existing.qtyMilli) : '1'))
  }

  function openCostPad(productId: string) {
    const line = lines.find((l) => l.productId === productId)
    const product = productById.get(productId)
    if (!line || !product) return
    openPad('cost', product, line.costPricePaise != null ? rupeesFromPaise(line.costPricePaise) : '')
  }

  function openCorrectPad(product: ProductCache) {
    openPad('correct', product, correctQtyMilli === null ? '' : formatQty(correctQtyMilli))
  }

  function closePad() {
    setPad(null)
    setPadError(null)
  }

  function handlePadDone() {
    if (!pad) return
    const product = productById.get(pad.productId)
    if (!product) {
      closePad()
      return
    }
    if (pad.kind === 'cost') {
      const text = padValue.trim()
      const paise = text === '' ? null : toPaise(text)
      if (text !== '' && paise === null) {
        setPadError(t('products.err.price'))
        return
      }
      setLines((prev) =>
        prev.map((line) => (line.productId === pad.productId ? { ...line, costPricePaise: paise } : line)),
      )
      closePad()
      return
    }
    const milli = parseQty(padValue, product.unit)
    if (milli === null) {
      setPadError(t('billing.qtyInvalid'))
      return
    }
    if (pad.kind === 'correct') {
      setCorrectQtyMilli(milli)
      setCorrectError(null)
      closePad()
      return
    }
    setLines((prev) => {
      const index = prev.findIndex((line) => line.productId === product.id)
      if (index >= 0) {
        const next = [...prev]
        next[index] = { ...next[index], qtyMilli: milli }
        return next
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          nameTa: product.name_ta,
          unit: product.unit,
          qtyMilli: milli,
          costPricePaise: null,
        },
      ]
    })
    closePad()
  }

  async function handleSaveStock() {
    if (!shopId || lines.length === 0 || busy) return
    setBusy(true)
    try {
      await addStock(
        shopId,
        lines.map((line) => ({
          productId: line.productId,
          qtyMilli: line.qtyMilli,
          costPricePaise: line.costPricePaise,
        })),
        note,
      )
      const count = lines.length
      setLines([])
      setNote('')
      await pullProducts(shopId).catch(() => {})
      await refreshStockInsights(shopId).catch(() => {})
      showToast(t('stock.saved', { n: count }))
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveCorrection() {
    if (!shopId || !correctProduct || busy) return
    if (correctQtyMilli === null) {
      setCorrectError(t('billing.qtyInvalid'))
      return
    }
    if (correctNote.trim() === '') {
      setCorrectError(t('stock.noteRequired'))
      return
    }
    setBusy(true)
    try {
      await adjustStock(shopId, correctProduct.id, correctQtyMilli, correctNote)
      setCorrectProductId(null)
      setCorrectQtyMilli(null)
      setCorrectNote('')
      await pullProducts(shopId).catch(() => {})
      await refreshStockInsights(shopId).catch(() => {})
      showToast(t('stock.correctDone'))
    } catch (err) {
      setCorrectError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleCode(code: string) {
    setScanOpen(false)
    const product = products.find((p) => p.is_active && p.barcode === code)
    if (product) {
      openQtyPad(product)
      return
    }
    setUnknownCode(code)
  }

  async function handleMakeList() {
    if (!shopId || suggestions.length === 0 || buildingList) return
    const entries: ShoppingListEntry[] = suggestions.map(({ product, qty }) => ({
      name: product.name,
      nameTa: product.name_ta,
      qty,
      unitLabel: t(`unit.${product.unit}`),
    }))
    const openSheet = () =>
      setListSheet({
        text: buildShoppingListText(shop?.name ?? '', t('stock.listTitle'), entries),
        count: entries.length,
      })

    setBuildingList(true)
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({ shop_id: shopId })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      const listId = (data as { id: string }).id
      const { error: itemError } = await supabase.from('shopping_list_items').insert(
        suggestions.map(({ product, qty }) => ({
          list_id: listId,
          shop_id: shopId,
          product_id: product.id,
          suggested_qty: qty,
          unit: product.unit,
        })),
      )
      if (itemError) throw new Error(itemError.message)
      openSheet()
    } catch (err) {
      if (isNetworkMessage(err instanceof Error ? err.message : String(err))) {
        openSheet()
      } else {
        showToast(errorMessage(err), 'error')
      }
    } finally {
      setBuildingList(false)
    }
  }

  if (!shopId) return null

  const unitLabel = (unit: Unit) => t(`unit.${unit}`)

  return (
    <div className="flex flex-col gap-3 p-4 pb-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">{t('nav.stock')}</h1>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="min-h-[48px] rounded-control border border-line bg-surface px-4 text-base font-semibold text-ink active:bg-brand-tint"
        >
          {t('stock.productsEntry')}
        </button>
      </div>

      <PillTabs items={TABS} value={tab} onChange={(id) => setTab(id as Tab)} />

      {products.length === 0 ? (
        <EmptyState
          titleKey="stock.noProductsTitle"
          bodyKey="stock.noProductsBody"
          actionKey="stock.addProduct"
          onAction={() => navigate('/products')}
          icon={<PlusIcon className="h-6 w-6" />}
        />
      ) : correctProduct ? (
        <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{correctProduct.name}</h2>
            {correctProduct.name_ta && <p className="text-sm text-ink-muted">{correctProduct.name_ta}</p>}
          </div>

          <div className="flex items-center justify-between rounded-control bg-page px-3 py-3">
            <span className="text-sm font-medium text-ink-muted">{t('stock.current')}</span>
            <span className="text-lg font-bold tabular-nums text-ink">
              {trimNumber(correctProduct.stock_qty)} {unitLabel(correctProduct.unit)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openCorrectPad(correctProduct)}
            className="flex min-h-[56px] items-center justify-between gap-2 rounded-control border border-line px-4 text-left active:bg-brand-tint"
          >
            <span className="text-sm font-medium text-ink-muted">{t('stock.newQty')}</span>
            <span className={`text-base font-semibold ${correctQtyMilli === null ? 'text-brand' : 'text-ink'}`}>
              {correctQtyMilli === null
                ? t('stock.tapToSet')
                : `${formatQty(correctQtyMilli)} ${unitLabel(correctProduct.unit)}`}
            </span>
          </button>

          <T className="text-[13px] leading-tight" {...bi('stock.correctHint')} />

          <label className="flex flex-col gap-1 text-sm font-medium text-ink-muted">
            {t('stock.reason')}
            <input
              type="text"
              value={correctNote}
              onChange={(e) => {
                setCorrectNote(e.target.value)
                setCorrectError(null)
              }}
              className="min-h-[48px] rounded-control border border-line bg-page px-4 text-base text-ink"
            />
          </label>

          {correctError && (
            <p className="rounded-control bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {correctError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleSaveCorrection()}
            disabled={busy}
            className="min-h-[56px] rounded-control bg-brand text-lg font-semibold text-white active:bg-brand-dark disabled:opacity-50"
          >
            {t('stock.saveCorrect')}
          </button>
          <button
            type="button"
            onClick={() => {
              setCorrectProductId(null)
              setCorrectQtyMilli(null)
              setCorrectNote('')
              setCorrectError(null)
            }}
            className="min-h-[48px] rounded-control border border-line text-base font-semibold text-ink active:bg-brand-tint"
          >
            {t('common.cancel')}
          </button>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StockAction labelKey="stock.scan" Icon={ScanIcon} onClick={() => setScanOpen(true)} />
            <StockAction
              labelKey="stock.addBySearch"
              Icon={PlusIcon}
              onClick={() => setSearchOpen(true)}
            />
            <StockAction
              labelKey="stock.addByVoice"
              Icon={MicIcon}
              onClick={() => {
                if (voiceSupported()) setVoiceOpen(true)
                else showToast(t('stock.voiceUnsupported'), 'error')
              }}
            />
          </div>

          {lines.length > 0 && (
            <section className="rounded-card border border-line bg-surface">
              <h2 className="border-b border-line px-3 py-2 text-sm font-semibold text-ink-muted">
                {t('stock.linesTitle')} · {lines.length}
              </h2>
              <ul className="divide-y divide-line">
                {lines.map((line) => (
                  <li key={line.productId} className="flex min-h-[64px] items-center gap-1 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        const product = productById.get(line.productId)
                        if (product) openQtyPad(product)
                      }}
                      aria-label={t('stock.editQty')}
                      className="min-w-0 flex-1 py-1 text-left"
                    >
                      <span className="block truncate font-semibold text-ink">{line.name}</span>
                      <span className="block text-[13px] leading-tight text-ink-muted">
                        + {formatQty(line.qtyMilli)} {unitLabel(line.unit)}
                        {line.costPricePaise !== null && ` · ${formatMoney(line.costPricePaise)}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openCostPad(line.productId)}
                      aria-label={t('stock.costOptional')}
                      className="min-h-[48px] shrink-0 rounded-control border border-line px-3 text-base font-semibold text-ink active:bg-brand-tint"
                    >
                      ₹
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) => prev.filter((l) => l.productId !== line.productId))
                      }
                      aria-label={t('stock.removeLine')}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-danger active:bg-danger-soft"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
              <label className="flex flex-col gap-1 border-t border-line px-3 py-2 text-sm font-medium text-ink-muted">
                {t('stock.note')}
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('stock.notePlaceholder')}
                  className="min-h-[48px] rounded-control border border-line bg-page px-4 text-base text-ink"
                />
              </label>
            </section>
          )}

          <button
            type="button"
            onClick={() => void handleMakeList()}
            disabled={suggestions.length === 0 || buildingList}
            className="min-h-[52px] w-full rounded-control border border-brand bg-surface px-4 text-base font-semibold text-brand active:bg-brand-tint disabled:opacity-50"
          >
            {t('stock.makeList')}
            {suggestions.length > 0 ? ` · ${suggestions.length}` : ''}
          </button>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('stock.search')}
            className="min-h-[48px] w-full rounded-control border border-line bg-surface px-4 text-base text-ink"
          />

          {visible.length === 0 ? (
            <p className="rounded-card bg-surface p-4 text-sm text-ink-muted">
              {tab === 'low' ? t('stock.lowNone') : t('products.noResults')}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface">
              {visible.map(({ product, insight }) => {
                const unit = unitLabel(product.unit)
                const buyQty = roundSuggestedQty(insight?.suggestedQty ?? 0, product.unit)
                const days = insight?.daysLeft ?? null
                const avg = insight && insight.avgDaily > 0 ? trimNumber(insight.avgDaily) : null
                return (
                  <li key={product.id} className="flex items-center gap-1 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openQtyPad(product)}
                      className="min-w-0 flex-1 py-1 text-left"
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="truncate font-semibold text-ink">{product.name}</span>
                        {product.name_ta && (
                          <span className="truncate text-[13px] text-ink-muted">{product.name_ta}</span>
                        )}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] leading-tight text-ink-muted">
                        <span className="font-medium text-ink">
                          {trimNumber(product.stock_qty)} {unit}
                        </span>
                        <span aria-hidden>·</span>
                        {days === null ? (
                          <span>{t('stock.noSales')}</span>
                        ) : (
                          <span>{t('stock.daysLeft', { n: daysLeftLabel(days) })}</span>
                        )}
                        {avg !== null && (
                          <>
                            <span aria-hidden>·</span>
                            <span>{t('stock.avgPerDay', { n: avg })}</span>
                          </>
                        )}
                      </span>
                      {buyQty > 0 && (
                        <span className="mt-1 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[13px] font-semibold text-brand">
                          {t('stock.buy', { qty: trimNumber(buyQty), unit })}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCorrectProductId(product.id)
                        setCorrectQtyMilli(null)
                        setCorrectNote('')
                        setCorrectError(null)
                      }}
                      aria-label={t('stock.correctTitle')}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-muted active:bg-brand-tint"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {lines.length > 0 && (
            <ConfirmBar
              floating
              labelKey="stock.save"
              onClick={() => void handleSaveStock()}
              disabled={busy}
            />
          )}
        </>
      )}

      <SearchSheet
        open={searchOpen}
        products={products}
        onPick={(product) => {
          setSearchOpen(false)
          openQtyPad(product)
        }}
        onClose={() => setSearchOpen(false)}
      />
      <VoiceSheet
        open={voiceOpen}
        products={activeProducts}
        onPick={(product) => {
          setVoiceOpen(false)
          openQtyPad(product)
        }}
        onClose={() => setVoiceOpen(false)}
      />
      <ScanSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onCode={handleCode}
        onManual={() => {
          setScanOpen(false)
          setSearchOpen(true)
        }}
      />
      <ShoppingListSheet
        text={listSheet?.text ?? null}
        itemCount={listSheet?.count ?? 0}
        onClose={() => setListSheet(null)}
      />

      {unknownCode && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
          onClick={() => setUnknownCode(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-t-card bg-surface px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised"
            role="dialog"
            aria-modal="true"
            aria-label={t('stock.unknownBarcode')}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-ink">{t('stock.unknownBarcode')}</h2>
            <p className="mt-1 font-mono text-lg font-bold tabular-nums text-ink">{unknownCode}</p>
            <button
              type="button"
              onClick={() => {
                const code = unknownCode
                setUnknownCode(null)
                navigate(`/products?barcode=${encodeURIComponent(code)}`)
              }}
              className="mt-3 min-h-[52px] w-full rounded-control bg-brand text-base font-semibold text-white active:bg-brand-dark"
            >
              {t('stock.addThisProduct')}
            </button>
            <button
              type="button"
              onClick={() => setUnknownCode(null)}
              className="mt-2 min-h-[48px] w-full rounded-control border border-line text-base font-semibold text-ink active:bg-brand-tint"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <NumberPad
        open={pad !== null}
        title={
          pad?.kind === 'cost'
            ? t('stock.costOptional')
            : pad?.kind === 'correct'
              ? t('stock.newQty')
              : t('billing.qty')
        }
        value={padValue}
        allowDecimal={pad?.kind === 'cost' ? true : pad ? ['kg', 'l'].includes(pad.unit) : false}
        maxDecimals={pad?.kind === 'cost' ? 2 : 3}
        suffix={pad?.kind === 'cost' ? '₹' : pad ? unitLabel(pad.unit) : undefined}
        error={padError}
        doneLabel={t('common.done')}
        onChange={(next) => {
          setPadValue(next)
          setPadError(null)
        }}
        onDone={handlePadDone}
        onClose={closePad}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        tone={toast?.tone}
        onDismiss={() => setToast(null)}
      />
    </div>
  )
}
