import { t } from '../../lib/i18n'
import { BackspaceIcon, CloseIcon } from '../ui/icons'

type Props = {
  open: boolean
  title: string
  value: string
  allowDecimal: boolean
  maxDecimals?: number
  suffix?: string
  error?: string | null
  doneLabel: string
  onChange: (next: string) => void
  onDone: () => void
  onClose: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'] as const

export default function NumberPad({
  open,
  title,
  value,
  allowDecimal,
  maxDecimals = allowDecimal ? 3 : 0,
  suffix,
  error,
  doneLabel,
  onChange,
  onDone,
  onClose,
}: Props) {
  if (!open) return null

  function press(key: string) {
    if (key === '.') {
      if (!allowDecimal || value.includes('.')) return
      onChange(value === '' ? '0.' : `${value}.`)
      return
    }
    const dot = value.indexOf('.')
    if (dot >= 0 && value.length - dot - 1 >= maxDecimals) return
    if (value.replace('.', '').length >= 9) return
    onChange(value === '0' ? key : value + key)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-t-card bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-12 w-12 place-items-center rounded-full text-ink-muted active:bg-brand-tint"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`mt-1 flex min-h-[64px] items-baseline justify-end gap-2 rounded-control bg-page px-4 py-2 ${
            error ? 'ring-2 ring-danger' : ''
          }`}
        >
          <span className="text-3xl font-bold tabular-nums text-ink">{value === '' ? '0' : value}</span>
          {suffix && <span className="text-base font-medium text-ink-muted">{suffix}</span>}
        </div>
        <div className="min-h-[20px] pt-1 text-right text-[13px] leading-tight text-danger">{error ?? ''}</div>

        <div className="mt-1 grid grid-cols-3 gap-2">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              disabled={key === '.' && !allowDecimal}
              className="min-h-[60px] rounded-control bg-page text-2xl font-bold text-ink active:bg-brand-soft disabled:opacity-30"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(value.slice(0, -1))}
            aria-label={t('billing.backspace')}
            className="grid min-h-[60px] place-items-center rounded-control bg-page text-ink-muted active:bg-brand-soft"
          >
            <BackspaceIcon className="h-6 w-6" />
          </button>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="mt-3 min-h-[56px] w-full rounded-control bg-brand text-lg font-semibold text-white active:bg-brand-dark"
        >
          {doneLabel}
        </button>
      </div>
    </div>
  )
}
