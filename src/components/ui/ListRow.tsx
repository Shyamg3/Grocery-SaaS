import type { ReactNode } from 'react'
import { bi } from '../../lib/i18n'
import { PencilIcon, TrashIcon } from './icons'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  value?: string
  onEdit?: () => void
  onRemove?: () => void
  removeLabel?: string
  className?: string
}

export default function ListRow({ title, subtitle, value, onEdit, onRemove, removeLabel, className = '' }: Props) {
  return (
    <div
      className={`flex min-h-[64px] items-center gap-3 border-b border-line py-2 last:border-b-0 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-snug text-ink">{title}</div>
        {subtitle && <div className="mt-0.5 text-[13px] leading-tight text-ink-muted">{subtitle}</div>}
      </div>
      {value && <div className="shrink-0 text-base font-semibold tabular-nums text-ink">{value}</div>}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={bi('products.editTitle').ta}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-muted active:bg-brand-tint"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-danger active:bg-danger-soft"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
