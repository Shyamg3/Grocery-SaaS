import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { db } from '../db/db'
import { retrySync } from '../db/sync'
import { t } from '../lib/i18n'

function useSyncStatus() {
  const [status, setStatus] = useState({ online: navigator.onLine, pending: 0, errors: 0 })

  useEffect(() => {
    const sub = liveQuery(async () => {
      const rows = await db.outbox.toArray()
      return {
        pending: rows.filter((r) => r.status === 'pending').length,
        errors: rows.filter((r) => r.status === 'error').length,
      }
    }).subscribe({
      next: (v) => setStatus((s) => ({ ...s, pending: v.pending, errors: v.errors })),
    })
    const goOnline = () => setStatus((s) => ({ ...s, online: true }))
    const goOffline = () => setStatus((s) => ({ ...s, online: false }))
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      sub.unsubscribe()
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return status
}

export default function SyncBadge() {
  const { online, pending, errors } = useSyncStatus()
  const [busy, setBusy] = useState(false)

  async function handleRetry() {
    setBusy(true)
    try {
      await retrySync()
    } finally {
      setBusy(false)
    }
  }

  let dotClass = 'bg-emerald-500'
  let text = t('sync.online')
  if (!online) {
    dotClass = 'bg-neutral-400'
    text = t('sync.offline')
  } else if (errors > 0) {
    dotClass = 'bg-red-500'
    text = t('sync.error')
  } else if (pending > 0) {
    dotClass = 'bg-amber-500'
    text = t('sync.waiting', { n: pending })
  }

  return (
    <div className="flex items-center justify-end gap-2 px-4 py-1 text-xs font-medium text-neutral-600">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{text}</span>
      {errors > 0 && online && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={busy}
          className="min-h-[48px] px-2 font-bold text-emerald-700 active:bg-emerald-50 disabled:opacity-50"
        >
          {t('sync.retryNow')}
        </button>
      )}
    </div>
  )
}
