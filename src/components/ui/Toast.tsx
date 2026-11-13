import { AlertIcon, CheckIcon } from './icons'

type Props = {
  message: string
  visible: boolean
  tone?: 'success' | 'error'
  onDismiss?: () => void
}

export default function Toast({ message, visible, tone = 'success', onDismiss }: Props) {
  if (!visible) return null
  const error = tone === 'error'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto w-full max-w-md px-4">
      <button
        type="button"
        role="status"
        onClick={onDismiss}
        className={`pointer-events-auto flex min-h-[52px] w-full items-center gap-3 rounded-control px-4 py-3 text-left text-base font-medium text-white shadow-raised ${
          error ? 'bg-danger' : 'bg-ink'
        }`}
      >
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
            error ? 'bg-white/20' : 'bg-brand'
          }`}
        >
          {error ? <AlertIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
        </span>
        <span className="font-tamil min-w-0 flex-1">{message}</span>
      </button>
    </div>
  )
}
