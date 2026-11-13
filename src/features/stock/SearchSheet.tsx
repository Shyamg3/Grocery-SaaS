import { useEffect, useMemo, useState } from 'react'
import T from '../../components/ui/T'
import { CloseIcon } from '../../components/ui/icons'
import type { ProductCache } from '../../db/db'
import { bi, t } from '../../lib/i18n'
import { formatMoney } from '../../lib/money'

type Props = {
  open: boolean
  products: ProductCache[]
  onPick: (product: ProductCache) => void
  onClose: () => void
}

export default function SearchSheet({ open, products, onPick, onClose }: Props) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const active = products.filter((p) => p.is_active)
    if (q === '') return active
    return active.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.name_ta?.toLowerCase().includes(q) ?? false) ||
        p.aliases.some((a) => a.toLowerCase().includes(q)),
    )
  }, [products, search])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-card bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised"
        role="dialog"
        aria-modal="true"
        aria-label={t('stock.addBySearch')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">
            <T {...bi('stock.addBySearch')} />
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-12 w-12 place-items-center rounded-full text-ink-muted active:bg-brand-tint"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('stock.search')}
          autoFocus
          className="mt-2 min-h-[48px] w-full rounded-control border border-line bg-page px-4 text-base"
        />

        <div className="mt-2 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-muted">{t('products.noResults')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => onPick(product)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-3 py-2 text-left active:bg-brand-tint"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{product.name}</span>
                      {product.name_ta && (
                        <span className="block truncate text-[13px] text-ink-muted">{product.name_ta}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-ink-muted">{formatMoney(product.sell_price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
