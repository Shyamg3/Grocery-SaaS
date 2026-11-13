import { useLangMode } from '../../lib/useLanguage'

type Props = {
  ta: string
  en: string
  /** classes for the primary line (size/weight/color) */
  className?: string
  /** classes for the small English line shown in "Both" mode */
  subClassName?: string
}

/**
 * Bilingual text: Tamil large with English small underneath.
 * In "ta" mode only Tamil shows, in "en" mode only English shows.
 */
export default function T({ ta, en, className = '', subClassName }: Props) {
  const mode = useLangMode()

  if (mode === 'ta') return <span className={`font-tamil ${className}`}>{ta}</span>
  if (mode === 'en') return <span className={className}>{en}</span>

  return (
    <span className="block">
      <span className={`block font-tamil ${className}`}>{ta}</span>
      <span className={`mt-0.5 block text-[13px] leading-tight ${subClassName ?? 'text-ink-muted'}`}>
        {en}
      </span>
    </span>
  )
}
