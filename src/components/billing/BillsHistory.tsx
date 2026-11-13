import { liveQuery } from 'dexie'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db, type LocalBill } from '../../db/db'
import { pullBills } from '../../db/sync'
import { useShop } from '../../features/shop/ShopProvider'
import { groupBillsByDay, localDayKey } from '../../lib/billing'
import { t } from '../../lib/i18n'
import { formatMoney } from '../../lib/money'
import { useLangMode } from '../../lib/useLanguage'
import { BillIcon } from '../ui/icons'
import EmptyState from '../ui/EmptyState'

function matchesBill(bill: LocalBill, query: string): boolean {
  if (query === '') return true
  if (bill.billNo !== null && bill.billNo !== undefined && `#${bill.billNo}`.includes(query)) return true
  if (formatMoney(bill.totalPaise).includes(query)) return true
  return (bill.items ?? []).some(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      (item.nameTa?.toLowerCase().includes(query) ?? false),
  )
}

export default function BillsHistory({ onNewBill }: { onNewBill: () => void }) {
  const { shop } = useShop()
  const shopId = shop?.id ?? null
  const mode = useLangMode()
  const lang = mode === 'en' ? 'en' : 'ta'

  const [bills, setBills] = useState<LocalBill[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!shopId) return
    const sub = liveQuery(() => db.localBills.where('shopId').equals(shopId).toArray()).subscribe({
      next: setBills,
      error: () => setBills([]),
    })
    return () => sub.unsubscribe()
  }, [shopId])

  useEffect(() => {
    if (!shopId) return
    void pullBills(shopId).catch(() => {})
    const refresh = () => void pullBills(shopId).catch(() => {})
    window.addEventListener('online', refresh)
    return () => window.removeEventListener('online', refresh)
  }, [shopId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bills.filter((bill) => matchesBill(bill, q))
  }, [bills, search])

  const groups = useMemo(() => groupBillsByDay(filtered), [filtered])
  const todayKey = localDayKey(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = localDayKey(yesterday)
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN'
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
  const dayFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })

  function heading(key: string): string {
    if (key === todayKey) return t('bills.today')
    if (key === yesterdayKey) return t('bills.yesterday')
    const [y, m, d] = key.split('-').map(Number)
    return dayFormat.format(new Date(y, m - 1, d))
  }

  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">{t('bills.title')}</h2>
        <span className="text-[13px] tabular-nums text-ink-muted">
          {t('bills.count', { n: bills.length })}
        </span>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('bills.search')}
        className="mt-2 min-h-[52px] w-full rounded-control border border-line bg-surface px-4 text-base"
      />

      {bills.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            titleKey="bills.emptyTitle"
            bodyKey="bills.emptyBody"
            icon={<BillIcon className="h-6 w-6" />}
          />
          <button
            type="button"
            onClick={onNewBill}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center rounded-control bg-brand text-base font-semibold text-white"
          >
            {t('invoice.newBill')}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink-muted">{t('bills.noResults')}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {groups.map((group) => (
            <section key={group.dayKey}>
              <h3 className="px-1 text-[13px] font-semibold text-ink-muted">{heading(group.dayKey)}</h3>
              <ul className="mt-1 overflow-hidden rounded-card border border-line bg-surface">
                {group.bills.map((bill) => (
                  <li key={bill.id}>
                    <Link
                      to={`/bills/${bill.id}`}
                      className="flex min-h-[68px] items-center gap-3 border-b border-line px-3 py-2 last:border-b-0 active:bg-brand-tint"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-base font-semibold text-ink">
                            {bill.billNo === null || bill.billNo === undefined
                              ? t('bills.pending')
                              : `#${bill.billNo}`}
                          </span>
                          {bill.status === 'void' && (
                            <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">
                              {t('bills.voidTag')}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-ink-muted">
                          {timeFormat.format(new Date(bill.createdAt))} · {t('bills.itemCount', { n: bill.itemCount })}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-base font-bold tabular-nums ${
                          bill.status === 'void' ? 'text-ink-muted line-through' : 'text-ink'
                        }`}
                      >
                        {formatMoney(bill.totalPaise)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
