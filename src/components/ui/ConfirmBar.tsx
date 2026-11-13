import { bi, type StringKey } from '../../lib/i18n'
import T from './T'
import { CheckIcon } from './icons'

type Props = {
  labelKey: StringKey
  hintKey?: StringKey
  onClick?: () => void
  disabled?: boolean
  className?: string
  value?: string
  valueLabel?: string
  floating?: boolean
}

export default function ConfirmBar({
  labelKey,
  hintKey,
  onClick,
  disabled = false,
  className = '',
  value,
  valueLabel,
  floating = false,
}: Props) {
  return (
    <div
      className={`sticky z-10 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur ${
        floating ? 'bottom-[calc(64px+env(safe-area-inset-bottom))] pb-3' : 'bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
      } ${className}`}
    >
      {value !== undefined && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-base font-medium text-ink-muted">{valueLabel}</span>
          <span className="text-2xl font-bold tabular-nums text-ink">{value}</span>
        </div>
      )}
      {hintKey && (
        <div className="mb-2 text-center">
          <T className="text-[13px] leading-tight" {...bi(hintKey)} />
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-control bg-brand px-5 text-lg font-semibold text-white active:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckIcon className="h-5 w-5" />
        <T {...bi(labelKey)} />
      </button>
    </div>
  )
}
