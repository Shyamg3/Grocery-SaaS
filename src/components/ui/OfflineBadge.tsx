import { bi } from '../../lib/i18n'
import T from './T'
import { WifiOffIcon } from './icons'

type Props = {
  online: boolean
  pending?: number
}

export default function OfflineBadge({ online, pending = 0 }: Props) {
  if (online && pending === 0) return null

  const label = online
    ? {
        ta: bi('design.offlinePending').ta.replace('{n}', String(pending)),
        en: bi('design.offlinePending').en.replace('{n}', String(pending)),
      }
    : bi('design.offlineText')

  return (
    <span className="inline-flex min-h-[36px] items-center gap-2 rounded-full bg-warning-soft px-3 text-warning">
      <WifiOffIcon className="h-4 w-4 shrink-0" />
      <T className="text-sm font-semibold" subClassName="text-warning/80" {...label} />
    </span>
  )
}
