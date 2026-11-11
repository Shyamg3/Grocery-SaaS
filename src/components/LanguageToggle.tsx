import { getLang, LANG_NAMES, setLang } from '../lib/i18n'

export default function LanguageToggle({ onToggle }: { onToggle: () => void }) {
  const lang = getLang()
  const next = lang === 'ta' ? 'en' : 'ta'
  return (
    <button
      type="button"
      onClick={() => {
        setLang(next)
        onToggle()
      }}
      className="min-h-[48px] rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-600 active:bg-neutral-100"
    >
      {LANG_NAMES[next]}
    </button>
  )
}
