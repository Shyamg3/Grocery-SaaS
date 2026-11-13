import { useMemo, useState } from 'react'
import { db, type CustomerCache } from '../../db/db'
import { createCustomer } from '../../lib/customers'
import { bi, t } from '../../lib/i18n'
import T from '../ui/T'
import { CheckIcon, CloseIcon, PlusIcon } from '../ui/icons'

type Props = {
  open: boolean
  shopId: string
  customers: CustomerCache[]
  selectedId: string | null
  online: boolean
  onSelect: (customer: CustomerCache) => void
  onCreated: (customer: CustomerCache) => void
  onClose: () => void
}

export default function CustomerSheet({
  open,
  shopId,
  customers,
  selectedId,
  online,
  onSelect,
  onCreated,
  onClose,
}: Props) {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q === '') return customers
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q),
    )
  }, [customers, search])

  if (!open) return null

  function reset() {
    setSearch('')
    setAdding(false)
    setName('')
    setPhone('')
    setError(null)
  }

  async function handleAdd() {
    if (saving) return
    if (name.trim() === '') {
      setError(t('error.fillRequired'))
      return
    }
    if (!online) {
      setError(t('billing.customerAddOffline'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await createCustomer(shopId, name.trim(), phone)
      const cached: CustomerCache = { ...created, syncedAt: new Date().toISOString() }
      await db.customers.put(cached)
      reset()
      onCreated(cached)
    } catch {
      setError(t('billing.customerSaveError'))
    } finally {
      setSaving(false)
    }
  }

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
        aria-label={t('billing.customerTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{t('billing.customerTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-12 w-12 place-items-center rounded-full text-ink-muted active:bg-brand-tint"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-2 overflow-y-auto">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('billing.customerSearch')}
            className="min-h-[48px] w-full rounded-control border border-line bg-page px-4 text-base"
          />

          {!online && (
            <p className="mt-2 rounded-control bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
              {t('billing.customerAddOffline')}
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-muted">{t('billing.noCustomers')}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {filtered.map((c) => {
                const on = c.id === selectedId
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        reset()
                        onSelect(c)
                      }}
                      className="flex min-h-[56px] w-full items-center gap-3 text-left active:bg-brand-tint"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold text-ink">{c.name}</span>
                        {c.phone && (
                          <span className="block text-[13px] text-ink-muted tabular-nums">{c.phone}</span>
                        )}
                      </span>
                      {on && <CheckIcon className="h-5 w-5 shrink-0 text-brand" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {adding ? (
            <div className="mt-3 rounded-card border border-line bg-page p-3">
              <label className="block text-[13px] font-medium text-ink-muted">
                <T {...bi('products.name')} />
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-control border border-line bg-surface px-4 text-base"
              />
              <label className="mt-2 block text-[13px] font-medium text-ink-muted">
                <T {...bi('billing.customerPhone')} />
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-control border border-line bg-surface px-4 text-base"
              />
              {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false)
                    setError(null)
                  }}
                  className="min-h-[48px] flex-1 rounded-control border border-line text-base font-semibold text-ink active:bg-brand-tint"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAdd()}
                  disabled={saving}
                  className="min-h-[48px] flex-1 rounded-control bg-brand text-base font-semibold text-white active:bg-brand-dark disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAdding(true)
                setError(null)
              }}
              className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-control border border-brand text-base font-semibold text-brand active:bg-brand-tint"
            >
              <PlusIcon className="h-5 w-5" />
              {t('billing.newCustomer')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
