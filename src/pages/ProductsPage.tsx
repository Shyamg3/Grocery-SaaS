import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CsvImport from '../components/CsvImport'
import ProductForm from '../components/ProductForm'
import { useShop } from '../features/shop/ShopProvider'
import { t } from '../lib/i18n'
import { formatMoney } from '../lib/money'
import { fetchProducts, type Product } from '../lib/products'

type View = 'list' | 'add' | 'edit' | 'import'

export default function ProductsPage() {
  const { shop } = useShop()
  const shopId = shop?.id ?? null
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [params] = useSearchParams()
  const [view, setView] = useState<View>(() => (params.get('barcode') ? 'add' : 'list'))
  const [prefillBarcode, setPrefillBarcode] = useState<string | null>(() => params.get('barcode'))
  const [editing, setEditing] = useState<Product | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!shopId) return
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    fetchProducts(shopId)
      .then((rows) => {
        if (!cancelled) setProducts(rows)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shopId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q === '') return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.name_ta?.toLowerCase().includes(q) ?? false) ||
        p.aliases.some((a) => a.toLowerCase().includes(q)),
    )
  }, [products, search])

  function refresh() {
    if (!shopId) return
    void fetchProducts(shopId)
      .then(setProducts)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }

  function handleSaved() {
    refresh()
    setView('list')
    setEditing(null)
    setPrefillBarcode(null)
  }

  if (!shopId) return null

  if (view === 'add' || view === 'edit') {
    return (
      <ProductForm
        key={editing?.id ?? 'new'}
        shopId={shopId}
        product={view === 'edit' ? editing : null}
        initialBarcode={view === 'add' ? prefillBarcode : null}
        onSaved={handleSaved}
        onCancel={() => {
          setView('list')
          setEditing(null)
        }}
      />
    )
  }

  if (view === 'import') {
    return (
      <CsvImport
        shopId={shopId}
        existingNames={new Set(products.map((p) => p.name.toLowerCase()))}
        onDone={(count) => {
          refresh()
          setView('list')
          setNotice(t('import.done', { n: count }))
        }}
        onCancel={() => setView('list')}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-6">
      <h1 className="text-xl font-bold">{t('products.title')}</h1>
      {notice && (
        <div className="rounded-xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">
          {notice}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setPrefillBarcode(null)
            setView('add')
            setNotice(null)
          }}
          className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 text-base font-bold text-white active:bg-emerald-700"
        >
          {t('products.add')}
        </button>
        <button
          type="button"
          onClick={() => {
            setView('import')
            setNotice(null)
          }}
          className="min-h-[48px] flex-1 rounded-xl border border-emerald-600 text-base font-bold text-emerald-700 active:bg-emerald-50"
        >
          {t('products.import')}
        </button>
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('products.searchPlaceholder')}
        className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
      />

      {loadError && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          {t('products.loadError')}
          <button type="button" onClick={refresh} className="min-h-[48px] font-bold">
            {t('common.retry')}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {products.length === 0 ? t('products.empty') : t('products.noResults')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          {filtered.map((p) => {
            const low = p.stock_qty <= p.reorder_level
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(p)
                    setView('edit')
                    setNotice(null)
                  }}
                  className="flex min-h-[64px] w-full items-center justify-between gap-2 p-3 text-left active:bg-neutral-50"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.name_ta && <span className="truncate text-sm text-neutral-500">{p.name_ta}</span>}
                  </span>
                  <span className="flex flex-col items-end whitespace-nowrap">
                    <span className="font-medium">{formatMoney(p.sell_price)}</span>
                    <span className={`text-sm ${low ? 'font-bold text-red-600' : 'text-neutral-500'}`}>
                      {p.stock_qty} {t(`unit.${p.unit}`)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
