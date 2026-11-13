import { useEffect, useState } from 'react'
import { CloseIcon } from '../../components/ui/icons'
import { buildWhatsAppUrl } from '../../lib/invoice'
import { t } from '../../lib/i18n'

type Props = {
  text: string | null
  itemCount: number
  onClose: () => void
}

export default function ShoppingListSheet({ text, itemCount, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (text) setCopied(false)
  }, [text])

  if (text === null) return null

  async function copy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // clipboard can be blocked; the WhatsApp button still works
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-card bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised"
        role="dialog"
        aria-modal="true"
        aria-label={t('stock.listTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">
            {t('stock.listTitle')} · {itemCount}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-12 w-12 place-items-center rounded-full text-ink-muted active:bg-brand-tint"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <pre className="mt-2 max-h-[45dvh] overflow-y-auto rounded-control bg-page p-3 font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink">
          {text}
        </pre>

        <a
          href={buildWhatsAppUrl(text)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex min-h-[52px] w-full items-center justify-center rounded-control bg-brand text-base font-semibold text-white active:bg-brand-dark"
        >
          {t('stock.shareWhatsapp')}
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className="mt-2 min-h-[48px] w-full rounded-control border border-line text-base font-semibold text-ink active:bg-brand-tint"
        >
          {copied ? t('stock.copied') : t('stock.copy')}
        </button>
      </div>
    </div>
  )
}
