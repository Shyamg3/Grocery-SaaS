import { useState, type FormEvent } from 'react'
import { mapAuthError } from '../features/auth/AuthProvider'
import { t, type StringKey } from '../lib/i18n'
import { formatMoney, rupeesFromPaise, toPaise } from '../lib/money'
import { saveProduct, softDeleteProduct, UNITS, type Product, type ProductInput, type Unit } from '../lib/products'

interface Props {
  shopId: string
  product: Product | null
  onSaved: () => void
  onCancel: () => void
}

function parseQty(input: string): number | null {
  if (input.trim() === '') return 0
  const n = Number(input)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export default function ProductForm({ shopId, product, onSaved, onCancel }: Props) {
  const editing = product !== null
  const [quick, setQuick] = useState(!editing)
  const [name, setName] = useState(product?.name ?? '')
  const [nameTa, setNameTa] = useState(product?.name_ta ?? '')
  const [aliases, setAliases] = useState(product?.aliases.join(', ') ?? '')
  const [unit, setUnit] = useState<Unit>(product?.unit ?? 'pcs')
  const [sellPrice, setSellPrice] = useState(product ? rupeesFromPaise(product.sell_price) : '')
  const [costPrice, setCostPrice] = useState(
    product?.cost_price != null ? rupeesFromPaise(product.cost_price) : '',
  )
  const [stockQty, setStockQty] = useState(product ? String(product.stock_qty) : '')
  const [reorder, setReorder] = useState(product ? String(product.reorder_level) : '')
  const [errorKey, setErrorKey] = useState<StringKey | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorKey(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorKey('error.fillRequired')
      return
    }
    const sellPaise = toPaise(sellPrice)
    if (sellPaise === null) {
      setErrorKey('products.err.price')
      return
    }
    let costPaise: number | null = null
    if (costPrice.trim() !== '') {
      costPaise = toPaise(costPrice)
      if (costPaise === null) {
        setErrorKey('products.err.price')
        return
      }
    }
    const stock = parseQty(stockQty)
    const reorderQty = parseQty(reorder)
    if (stock === null || reorderQty === null) {
      setErrorKey('products.err.qty')
      return
    }
    const input: ProductInput = {
      name: trimmedName,
      name_ta: nameTa.trim() === '' ? null : nameTa.trim(),
      aliases: aliases
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a !== ''),
      unit,
      sellPricePaise: sellPaise,
      costPricePaise: costPaise,
      stockQty: stock,
      reorderLevel: reorderQty,
    }
    setBusy(true)
    try {
      await saveProduct(shopId, input, product?.id)
      onSaved()
    } catch (err) {
      setErrorKey(mapAuthError(err instanceof Error ? err.message : String(err)))
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!product || busy) return
    if (!window.confirm(t('products.deleteConfirm'))) return
    setBusy(true)
    try {
      await softDeleteProduct(shopId, product.id)
      onSaved()
    } catch (err) {
      setErrorKey(mapAuthError(err instanceof Error ? err.message : String(err)))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{t(editing ? 'products.editTitle' : 'products.addTitle')}</h1>
        {editing && product && (
          <div className="text-sm text-neutral-500">{formatMoney(product.sell_price)}</div>
        )}
      </div>

      {!editing && (
        <div className="grid grid-cols-2 gap-2" role="tablist">
          <button
            type="button"
            onClick={() => setQuick(true)}
            className={`min-h-[48px] rounded-xl border text-sm font-bold ${
              quick ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-neutral-200 text-neutral-600'
            }`}
          >
            {t('products.quickAdd')}
          </button>
          <button
            type="button"
            onClick={() => setQuick(false)}
            className={`min-h-[48px] rounded-xl border text-sm font-bold ${
              !quick ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-neutral-200 text-neutral-600'
            }`}
          >
            {t('products.fullForm')}
          </button>
        </div>
      )}

      {errorKey && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          {t(errorKey)}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        {t('products.name')}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={!editing}
          className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        {t('products.unit')}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
          className="min-h-[48px] rounded-xl border border-neutral-300 bg-white px-4 text-base"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {t(`unit.${u}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        {t('products.sellPrice')}
        <input
          type="text"
          inputMode="decimal"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          placeholder="0.00"
          className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
        />
      </label>

      {!quick && (
        <>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('products.nameTa')}
            <input
              type="text"
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('products.aliases')}
            <input
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder={t('products.aliasesPlaceholder')}
              className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('products.costPrice')}
            <input
              type="text"
              inputMode="decimal"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
              className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('products.stockQty')}
            <input
              type="text"
              inputMode="decimal"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              placeholder="0"
              className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('products.reorderLevel')}
            <input
              type="text"
              inputMode="decimal"
              value={reorder}
              onChange={(e) => setReorder(e.target.value)}
              placeholder="0"
              className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
            />
          </label>
        </>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 min-h-[56px] rounded-xl bg-emerald-600 text-lg font-bold text-white active:bg-emerald-700 disabled:opacity-50"
      >
        {t('products.save')}
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] flex-1 rounded-xl border border-neutral-300 text-base font-bold text-neutral-700 active:bg-neutral-100"
        >
          {t('common.cancel')}
        </button>
        {editing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="min-h-[48px] flex-1 rounded-xl border border-red-300 text-base font-bold text-red-600 active:bg-red-50 disabled:opacity-50"
          >
            {t('products.delete')}
          </button>
        )}
      </div>
    </form>
  )
}
