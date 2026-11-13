import { bi, type StringKey } from '../../lib/i18n'
import T from './T'

type Props = {
  labelKey: StringKey
  value: string
  hintKey?: StringKey
  tone?: 'default' | 'brand'
  className?: string
}

export default function StatCard({ labelKey, value, hintKey, tone = 'default', className = '' }: Props) {
  const brand = tone === 'brand'

  return (
    <div
      className={`flex min-h-[96px] flex-col justify-between rounded-card p-4 ${
        brand ? 'bg-brand text-white' : 'border border-line bg-surface text-ink'
      } ${className}`}
    >
      <T
        className={`text-base font-medium leading-tight ${brand ? 'text-white/85' : 'text-ink-muted'}`}
        subClassName={brand ? 'text-white/70' : undefined}
        {...bi(labelKey)}
      />
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className={`text-2xl font-bold tabular-nums ${brand ? 'text-white' : 'text-ink'}`}>{value}</span>
        {hintKey && (
          <span className={`text-[13px] ${brand ? 'text-white/70' : 'text-ink-muted'}`}>
            <T {...bi(hintKey)} />
          </span>
        )}
      </div>
    </div>
  )
}
