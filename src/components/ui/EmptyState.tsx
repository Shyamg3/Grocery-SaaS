import type { ReactNode } from 'react'
import { bi, type StringKey } from '../../lib/i18n'
import T from './T'

type Props = {
  titleKey: StringKey
  bodyKey: StringKey
  actionKey?: StringKey
  onAction?: () => void
  icon?: ReactNode
}

export default function EmptyState({ titleKey, bodyKey, actionKey, onAction, icon }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface/70 px-5 py-8 text-center">
      {icon && (
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">{icon}</span>
      )}
      <T className="text-base font-semibold" {...bi(titleKey)} />
      <T className="text-sm leading-snug" {...bi(bodyKey)} />
      {actionKey && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 min-h-[48px] rounded-control bg-brand px-5 text-base font-semibold text-white active:bg-brand-dark"
        >
          <T {...bi(actionKey)} />
        </button>
      )}
    </div>
  )
}
