import { bi, setLangMode, type LangMode } from '../../lib/i18n'
import { useLangMode } from '../../lib/useLanguage'

const options: { id: LangMode; labelKey: 'lang.ta' | 'lang.en' | 'lang.both' }[] = [
  { id: 'ta', labelKey: 'lang.ta' },
  { id: 'en', labelKey: 'lang.en' },
  { id: 'both', labelKey: 'lang.both' },
]

export default function LanguageToggle({
  value,
  onChange,
  className = '',
  variant = 'default',
}: {
  value?: LangMode
  onChange?: (mode: LangMode) => void
  className?: string
  variant?: 'default' | 'headerPill'
}) {
  const globalMode = useLangMode()
  const current = value ?? globalMode

  if (variant === 'headerPill') {
    return (
      <button
        type="button"
        aria-label="Switch language / மொழி மாற்றம்"
        onClick={() => {
          const next: LangMode = current === 'ta' ? 'en' : 'ta'
          setLangMode(next)
          onChange?.(next)
        }}
        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1 text-sm font-medium shadow-xs transition-colors hover:bg-brand-tint active:scale-95 ${className}`}
      >
        <span className={current === 'ta' ? 'font-bold text-brand font-tamil' : 'text-ink-muted font-tamil'}>தமிழ்</span>
        <span className="text-neutral-300">/</span>
        <span className={current === 'en' ? 'font-bold text-brand' : 'text-ink-muted'}>EN</span>
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-label={`${bi('lang.ta').ta} / ${bi('lang.en').en}`}
      className={`inline-flex gap-1 rounded-full border border-line bg-surface p-1 ${className}`}
    >
      {options.map(({ id, labelKey }) => {
        const on = current === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              setLangMode(id)
              onChange?.(id)
            }}
            className={`min-h-[48px] whitespace-nowrap rounded-full px-3 text-base font-medium ${
              on ? 'bg-brand text-white' : 'text-ink-muted active:bg-brand-tint'
            }`}
          >
            {/* language names read in their own script, never stacked bilingually */}
            <span className={id === 'en' ? '' : 'font-tamil'}>{bi(labelKey)[id === 'en' ? 'en' : 'ta']}</span>
          </button>
        )
      })}
    </div>
  )
}
