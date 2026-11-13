import { bi, type StringKey } from '../../lib/i18n'
import T from './T'
import { MicIcon } from './icons'

type Props = {
  labelKey: StringKey
  hintKey?: StringKey
  onClick?: () => void
  listening?: boolean
  size?: 'md' | 'lg'
}

export default function MicButton({ labelKey, hintKey, onClick, listening = false, size = 'lg' }: Props) {
  const circle = size === 'lg' ? 'h-24 w-24' : 'h-16 w-16'

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={listening}
        aria-label={bi(labelKey).ta}
        className={`relative grid ${circle} place-items-center rounded-full bg-brand text-white shadow-raised active:bg-brand-dark`}
      >
        {listening && (
          <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" aria-hidden="true" />
        )}
        <MicIcon className={size === 'lg' ? 'h-9 w-9' : 'h-6 w-6'} />
      </button>
      <T className="text-base font-semibold text-brand" {...bi(labelKey)} />
      {hintKey && <T className="text-[13px] text-center" {...bi(hintKey)} />}
    </div>
  )
}
