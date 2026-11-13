import { bi, type StringKey } from '../../lib/i18n'
import T from './T'

type Item = { id: string; labelKey: StringKey }

type Props = {
  items: Item[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export default function PillTabs({ items, value, onChange, className = '' }: Props) {
  return (
    <div className={`flex gap-1 rounded-full border border-line bg-surface p-1 ${className}`}>
      {items.map(({ id, labelKey }) => {
        const on = value === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className={`min-h-[48px] flex-1 rounded-full px-2 text-base font-medium ${
              on ? 'bg-brand text-white' : 'text-ink-muted active:bg-brand-tint'
            }`}
          >
            <span className="flex flex-col items-center justify-center leading-tight">
              <T {...bi(labelKey)} className="text-base leading-tight whitespace-nowrap" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
