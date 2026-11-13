import { useEffect, useRef, useState } from 'react'
import MicButton from '../../components/ui/MicButton'
import { CloseIcon } from '../../components/ui/icons'
import type { ProductCache } from '../../db/db'
import { getLang, t, type StringKey } from '../../lib/i18n'
import { listenOnce, matchProduct, voiceSupported } from './voice'

type Props = {
  open: boolean
  products: ProductCache[]
  onPick: (product: ProductCache) => void
  onClose: () => void
}

export default function VoiceSheet({ open, products, onPick, onClose }: Props) {
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState<string | null>(null)
  const [messageKey, setMessageKey] = useState<StringKey | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const productsRef = useRef(products)
  productsRef.current = products

  function start() {
    cancelRef.current?.()
    setHeard(null)
    setMessageKey(null)
    setListening(true)
    cancelRef.current = listenOnce(getLang(), {
      onTranscript: (text) => {
        setHeard(text)
        const match = matchProduct(productsRef.current, text)
        if (match) {
          onPickRef.current(match)
          return
        }
        setMessageKey('stock.voiceNoMatch')
      },
      onError: (reason) =>
        setMessageKey(
          reason === 'unsupported'
            ? 'stock.voiceUnsupported'
            : reason === 'denied'
              ? 'stock.voiceDenied'
              : 'stock.voiceFailed',
        ),
      onEnd: () => setListening(false),
    })
  }

  useEffect(() => {
    if (!open) return
    if (voiceSupported()) start()
    else setMessageKey('stock.voiceUnsupported')
    return () => {
      cancelRef.current?.()
      cancelRef.current = null
      setListening(false)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-t-card bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised"
        role="dialog"
        aria-modal="true"
        aria-label={t('stock.addByVoice')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{t('stock.voiceTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-12 w-12 place-items-center rounded-full text-ink-muted active:bg-brand-tint"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 py-5">
          <MicButton
            labelKey="stock.addByVoice"
            hintKey="stock.voiceHint"
            onClick={start}
            listening={listening}
            size="md"
          />
          {heard && (
            <p className="text-center text-sm text-ink-muted">
              {t('stock.voiceHeard')}: <span className="font-medium text-ink">{heard}</span>
            </p>
          )}
          {messageKey && (
            <p role="alert" className="text-center text-sm font-medium text-danger">
              {t(messageKey)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] w-full rounded-control border border-line text-base font-semibold text-ink active:bg-brand-tint"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
