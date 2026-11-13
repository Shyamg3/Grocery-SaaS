import { useEffect, useRef, useState } from 'react'
import T from '../../components/ui/T'
import { CloseIcon } from '../../components/ui/icons'
import { bi, t, type StringKey } from '../../lib/i18n'
import { scanFailure, startScan, type ScanFailure, type ScanHandle } from './scan'

type Props = {
  open: boolean
  onClose: () => void
  onCode: (code: string) => void
  onManual: () => void
}

const ERROR_KEYS: Record<ScanFailure, StringKey> = {
  denied: 'stock.scanDenied',
  unsupported: 'stock.scanUnsupported',
  failed: 'stock.scanFailed',
}

export default function ScanSheet({ open, onClose, onCode, onManual }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const handleRef = useRef<ScanHandle | null>(null)
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode

  const [error, setError] = useState<ScanFailure | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) return
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    setError(null)
    setReady(false)

    startScan(video, (code) => {
      if (!cancelled) onCodeRef.current(code)
    })
      .then((handle) => {
        if (cancelled) {
          handle.stop()
          return
        }
        handleRef.current = handle
        setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(scanFailure(err))
      })

    return () => {
      cancelled = true
      handleRef.current?.stop()
      handleRef.current = null
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/70"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-t-card bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised"
        role="dialog"
        aria-modal="true"
        aria-label={t('stock.scanTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">
            <T {...bi('stock.scanTitle')} />
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

        <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-card bg-black">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {!error && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-center text-sm text-white">
              <T {...bi('stock.scanHint')} subClassName="text-white/80" />
            </div>
          )}
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-control bg-warning-soft px-3 py-2 text-center text-sm font-medium text-warning"
          >
            {t(ERROR_KEYS[error])}
          </p>
        ) : !ready ? (
          <p className="mt-2 text-center text-sm text-ink-muted">{t('common.loading')}</p>
        ) : null}

        <button
          type="button"
          onClick={onManual}
          className="mt-3 min-h-[52px] w-full rounded-control border border-brand text-base font-semibold text-brand active:bg-brand-tint"
        >
          {t('stock.addBySearch')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 min-h-[48px] w-full rounded-control border border-line text-base font-semibold text-ink active:bg-brand-tint"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
