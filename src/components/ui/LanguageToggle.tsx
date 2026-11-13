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
}: {
  value?: LangMode
  onChange?: (mode: LangMode) => void
  className?: string
}) {
  const globalMode = useLangMode()
  const current = value ?? globalMode

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
