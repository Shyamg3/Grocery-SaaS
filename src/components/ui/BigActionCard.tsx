import type { ReactNode } from 'react'
import { bi, type StringKey } from '../../lib/i18n'
import T from './T'
import { ArrowRightIcon, PlusIcon } from './icons'

type Props = {
  variant?: 'voice' | 'plain'
  titleKey?: StringKey
  subtitleKey?: StringKey
  /** Optional dynamic bilingual override; takes precedence over the keys. */
  title?: { ta: string; en: string }
  subtitle?: { ta: string; en: string }
  icon?: ReactNode
  onClick?: () => void
  className?: string
}

export default function BigActionCard({
  variant = 'plain',
  titleKey,
  subtitleKey,
  title,
  subtitle,
  icon,
  onClick,
  className = '',
}: Props) {
  const titleText = title ?? (titleKey ? bi(titleKey) : null)
  const subtitleText = subtitle ?? (subtitleKey ? bi(subtitleKey) : null)
  if (variant === 'voice') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex min-h-[200px] w-full flex-col justify-between rounded-card bg-brand p-5 text-left text-white shadow-card active:bg-brand-dark ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15">{icon}</div>
          <div className="min-w-0 flex-1">
            {titleText && (
              <div>
                <T className="text-xl font-bold leading-snug" subClassName="text-white/85" {...titleText} />
              </div>
            )}
            {subtitleText && (
              <div className="mt-1">
                <T
                  className="text-base leading-snug text-white/90"
                  subClassName="text-white/75"
                  {...subtitleText}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <T className="text-base font-semibold" subClassName="text-white/75" {...bi('home.voiceStart')} />
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand">
            <ArrowRightIcon className="h-5 w-5" />
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-card border border-line bg-surface p-4 text-left shadow-card active:bg-brand-tint ${className}`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        {titleText && (
          <span className="block">
            <T className="text-base font-semibold" {...titleText} />
          </span>
        )}
        {subtitleText && (
          <span className="mt-0.5 block">
            <T className="text-[13px] leading-tight" {...subtitleText} />
          </span>
        )}
      </span>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white">
        <PlusIcon className="h-5 w-5" />
      </span>
    </button>
  )
}
