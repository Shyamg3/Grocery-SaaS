import type { ReactNode } from 'react'
import { bi, type StringKey } from '../../lib/i18n'
import T from './T'
import { ArrowRightIcon, PlusIcon } from './icons'

type Props = {
  variant?: 'voice' | 'plain' | 'alert'
  titleKey?: StringKey
  subtitleKey?: StringKey
  /** Optional dynamic bilingual override; takes precedence over the keys. */
  title?: { ta: string; en: string }
  subtitle?: { ta: string; en: string }
  icon?: ReactNode
  onClick?: () => void
  className?: string
  footnoteKey?: StringKey
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
  footnoteKey,
}: Props) {
  const titleText = title ?? (titleKey ? bi(titleKey) : null)
  const subtitleText = subtitle ?? (subtitleKey ? bi(subtitleKey) : null)

  if (variant === 'voice') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <button
          type="button"
          onClick={onClick}
          className="group relative flex min-h-[220px] w-full flex-col justify-between overflow-hidden rounded-card bg-brand p-6 text-left text-white shadow-raised transition-all active:scale-[0.99] active:bg-brand-dark"
        >
          <div>
            {titleText && (
              <T
                className="text-2xl font-bold leading-tight tracking-tight text-white font-tamil"
                subClassName="text-white/85 text-lg"
                {...titleText}
              />
            )}
            {subtitleText && (
              <div className="mt-1.5">
                <T
                  className="text-sm font-medium leading-normal text-white/90"
                  subClassName="text-white/75"
                  {...subtitleText}
                />
              </div>
            )}
          </div>

          <div className="my-3 flex items-center justify-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-brand shadow-md transition-transform group-hover:scale-105 active:scale-95">
              <span className="scale-125">{icon}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/15 pt-3">
            <span className="text-base font-semibold tracking-wide text-white">
              <T {...bi('home.voiceStart')} />
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white transition-transform group-hover:translate-x-1">
              <ArrowRightIcon className="h-5 w-5" />
            </span>
          </div>
        </button>

        {footnoteKey && (
          <p className="mt-2.5 text-center text-xs font-medium text-ink-muted">
            <T {...bi(footnoteKey)} />
          </p>
        )}
      </div>
    )
  }

  if (variant === 'alert') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex min-h-[72px] w-full items-center justify-between gap-3 rounded-card border border-amber-200/80 bg-[#fef7ee] p-4 text-left shadow-card transition-all active:bg-amber-100/70 ${className}`}
      >
        <div className="min-w-0 flex-1">
          {titleText && (
            <span className="block text-base font-bold text-amber-950">
              <T {...titleText} />
            </span>
          )}
          {subtitleText && (
            <span className="mt-0.5 block text-xs font-medium text-amber-800/80">
              <T {...subtitleText} />
            </span>
          )}
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-amber-800">
          <ArrowRightIcon className="h-5 w-5" />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[76px] w-full items-center gap-3.5 rounded-card border border-line bg-surface p-4 text-left shadow-card transition-all active:bg-brand-tint ${className}`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        {titleText && (
          <span className="block text-base font-semibold text-ink">
            <T {...titleText} />
          </span>
        )}
        {subtitleText && (
          <span className="mt-0.5 block text-xs text-ink-muted">
            <T {...subtitleText} />
          </span>
        )}
      </span>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-muted">
        <PlusIcon className="h-5 w-5" />
      </span>
    </button>
  )
}
