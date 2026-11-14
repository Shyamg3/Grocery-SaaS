import { useEffect, useMemo, useRef, useState } from 'react'
import NumberPad from '../../components/billing/NumberPad'
import MicButton from '../../components/ui/MicButton'
import T from '../../components/ui/T'
import { CloseIcon } from '../../components/ui/icons'
import type { ProductCache } from '../../db/db'
import { pullProducts } from '../../db/sync'
import { formatQty, lineTotalPaise, parseQty, qtyFromMilli } from '../../lib/billing'
import { bi, biVars, t, type StringKey } from '../../lib/i18n'
import { formatMoney } from '../../lib/money'
import { addProductAlias, type Unit } from '../../lib/products'
import SearchSheet from '../stock/SearchSheet'
import { VoiceParseError, parseVoice, saveFinalVoiceItems, type FinalVoiceItem } from './api'
import {
  AUTO_MATCH_MIN_CONFIDENCE,
  buildDraftRows,
  createProductFuse,
  normalizeUnit,
  productHasSpokenName,
  qtyMilliForProduct,
  type DraftRow,
} from './match'
import { recorderSupported, startRecording, type RecordingSession } from './recorder'
import { recordingToWavBase64 } from './wav'

const MAX_RECORD_MS = 15_000

const UNIT_KEYS: Record<Unit, StringKey> = {
  kg: 'unit.kg',
  g: 'unit.g',
  l: 'unit.l',
  ml: 'unit.ml',
  pcs: 'unit.pcs',
  pack: 'unit.pack',
}

type Phase = 'idle' | 'recording' | 'processing' | 'draft' | 'error'

interface RowState extends DraftRow {
  qtyTouched: boolean
  taught: boolean
}

type Props = {
  open: boolean
  shopId: string
  products: ProductCache[]
  online: boolean
  onAdd: (items: { product: ProductCache; qtyMilli: number }[], transcript?: string) => void
  onClose: () => void
  onToast: (message: string, tone?: 'success' | 'error') => void
}

function errorKeyFor(err: unknown): StringKey {
  if (!(err instanceof VoiceParseError)) return 'billing.voice.audio'
  switch (err.code) {
    case 'offline':
      return 'billing.voice.offline'
    case 'auth':
      return 'billing.voice.auth'
    case 'forbidden':
      return 'billing.voice.forbidden'
    case 'limit':
      return 'billing.voice.limit'
    case 'audio':
      return 'billing.voice.audio'
    default:
      return 'billing.voice.failed'
  }
}

export default function VoiceBillingSheet({
  open,
  shopId,
  products,
  online,
  onAdd,
  onClose,
  onToast,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorKey, setErrorKey] = useState<StringKey | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [rows, setRows] = useState<RowState[]>([])
  const [transcript, setTranscript] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [padKey, setPadKey] = useState<string | null>(null)
  const [padValue, setPadValue] = useState('')
  const [padError, setPadError] = useState<string | null>(null)
  const [searchKey, setSearchKey] = useState<string | null>(null)

  const sessionRef = useRef<RecordingSession | null>(null)
  const openRef = useRef(open)
  openRef.current = open

  const activeProducts = useMemo(() => products.filter((p) => p.is_active), [products])
  const productById = useMemo(
    () => new Map(activeProducts.map((p) => [p.id, p])),
    [activeProducts],
  )
  const fuse = useMemo(() => createProductFuse(activeProducts), [activeProducts])

  function reset() {
    sessionRef.current?.cancel()
    sessionRef.current = null
    setPhase('idle')
    setErrorKey(null)
    setElapsedMs(0)
    setRows([])
    setTranscript(null)
    setEventId(null)
    setPadKey(null)
    setPadValue('')
    setPadError(null)
    setSearchKey(null)
  }

  useEffect(() => {
    if (!open) reset()
  }, [open])

  useEffect(() => {
    return () => sessionRef.current?.cancel()
  }, [])

  async function handleRecording(blob: Blob) {
    setPhase('processing')
    setErrorKey(null)
    try {
      const audioBase64 = await recordingToWavBase64(blob)
      const result = await parseVoice(shopId, audioBase64, 'audio/wav')
      if (!openRef.current) return
      if (result.items.length === 0) {
        setPhase('error')
        setErrorKey('billing.voice.nothingHeard')
        return
      }
      const draft = buildDraftRows(result.items, fuse).map((row) => ({
        ...row,
        qtyTouched: false,
        taught: false,
      }))
      setRows(draft)
      setTranscript(result.transcript)
      setEventId(result.eventId)
      setPhase('draft')
    } catch (err) {
      if (!openRef.current) return
      setPhase('error')
      setErrorKey(errorKeyFor(err))
    }
  }

  function start() {
    if (!open || phase === 'recording' || phase === 'processing') return
    if (!online) {
      setPhase('error')
      setErrorKey('billing.voice.offline')
      return
    }
    if (activeProducts.length === 0) {
      setPhase('error')
      setErrorKey('billing.voice.noCatalog')
      return
    }
    if (!recorderSupported()) {
      setPhase('error')
      setErrorKey('billing.voice.unsupported')
      return
    }

    setRows([])
    setTranscript(null)
    setEventId(null)
    setErrorKey(null)
    setElapsedMs(0)
    setPhase('recording')
    sessionRef.current = startRecording({
      maxMs: MAX_RECORD_MS,
      onTick: setElapsedMs,
      onComplete: (recording) => {
        sessionRef.current = null
        void handleRecording(recording.blob)
      },
      onError: (failure) => {
        sessionRef.current = null
        setPhase('error')
        setErrorKey(
          failure === 'denied'
            ? 'billing.voice.micDenied'
            : failure === 'unsupported'
              ? 'billing.voice.unsupported'
              : 'billing.voice.failed',
        )
      },
    })
  }

  function stop() {
    sessionRef.current?.stop()
    sessionRef.current = null
  }

  function pickProduct(rowKey: string, product: ProductCache) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== rowKey) return row
        const qtyMilli = row.qtyTouched
          ? row.qtyMilli
          : qtyMilliForProduct(row.spokenQty, row.spokenUnit, product.unit)
        return { ...row, productId: product.id, qtyMilli }
      }),
    )
  }

  const padRow = rows.find((row) => row.key === padKey) ?? null
  const padUnit: Unit = padRow?.productId
    ? (productById.get(padRow.productId)?.unit ?? normalizeUnit(padRow.spokenUnit))
    : normalizeUnit(padRow?.spokenUnit ?? '')

  function openQty(row: RowState) {
    setPadKey(row.key)
    setPadValue(formatQty(row.qtyMilli))
    setPadError(null)
  }

  function commitQty() {
    if (!padRow) return
    const milli = parseQty(padValue, padUnit)
    if (milli === null) {
      setPadError(t('billing.qtyInvalid'))
      return
    }
    setRows((prev) =>
      prev.map((row) =>
        row.key === padRow.key ? { ...row, qtyMilli: milli, qtyTouched: true } : row,
      ),
    )
    setPadKey(null)
    setPadError(null)
  }

  async function teach(row: RowState, product: ProductCache) {
    if (!online) {
      onToast(t('billing.voice.teachOffline'), 'error')
      return
    }
    try {
      await addProductAlias(shopId, product.id, row.spokenName)
      setRows((prev) =>
        prev.map((item) => (item.key === row.key ? { ...item, taught: true } : item)),
      )
      void pullProducts(shopId).catch(() => {})
      onToast(t('billing.voice.taught'), 'success')
    } catch {
      onToast(t('billing.voice.teachFailed'), 'error')
    }
  }

  const allResolved =
    rows.length > 0 && rows.every((row) => row.productId !== null && productById.has(row.productId))
  const totalPaise = rows.reduce((sum, row) => {
    const product = row.productId ? productById.get(row.productId) : undefined
    return product ? sum + lineTotalPaise(product.sell_price, row.qtyMilli) : sum
  }, 0)

  function confirm() {
    if (!allResolved) return
    const additions: { product: ProductCache; qtyMilli: number }[] = []
    const finalItems: FinalVoiceItem[] = []
    for (const row of rows) {
      const product = row.productId ? productById.get(row.productId) : undefined
      if (!product) continue
      additions.push({ product, qtyMilli: row.qtyMilli })
      finalItems.push({
        spoken_name: row.spokenName,
        product_id: product.id,
        product_name: product.name,
        qty: qtyFromMilli(row.qtyMilli),
        unit: product.unit,
      })
    }
    if (additions.length !== rows.length) return

    onAdd(additions, transcript ?? undefined)
    if (eventId) {
      const id = eventId
      void saveFinalVoiceItems(id, finalItems).catch(() =>
        onToast(t('billing.voice.finalSaveError'), 'error'),
      )
    }
    onClose()
  }

  if (!open) return null

  const remaining = Math.max(0, Math.ceil((MAX_RECORD_MS - elapsedMs) / 1000))

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-card bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised"
        role="dialog"
        aria-modal="true"
        aria-label={t('billing.voice.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">
            <T {...bi('billing.voice.title')} />
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

        <div className="min-h-0 flex-1 overflow-y-auto">
          {(phase === 'idle' || phase === 'recording') && (
            <div className="flex flex-col items-center gap-3 py-6">
              <MicButton
                labelKey={phase === 'recording' ? 'billing.voice.stop' : 'billing.voice.start'}
                hintKey={phase === 'recording' ? undefined : 'billing.voice.hint'}
                onClick={phase === 'recording' ? stop : start}
                listening={phase === 'recording'}
              />
              {phase === 'recording' && (
                <div className="w-full">
                  <p className="text-center text-sm font-semibold text-brand">
                    {t('billing.voice.listening', { s: remaining })}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-tint">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${Math.min(100, (elapsedMs / MAX_RECORD_MS) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {activeProducts.length === 0 && (
                <p role="alert" className="text-center text-sm font-medium text-warning">
                  {t('billing.voice.noCatalog')}
                </p>
              )}
            </div>
          )}

          {phase === 'processing' && (
            <div className="flex flex-col items-center gap-3 py-10" role="status">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-tint border-t-brand" />
              <T className="text-base font-semibold text-ink" {...bi('billing.voice.processing')} />
            </div>
          )}

          {phase === 'error' && (
            <div className="py-6">
              <p role="alert" className="rounded-control bg-warning-soft px-3 py-3 text-center text-sm font-semibold text-warning">
                {t(errorKey ?? 'billing.voice.failed')}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={start}
                  className="min-h-[48px] flex-1 rounded-control bg-brand text-base font-semibold text-white active:bg-brand-dark"
                >
                  {t('billing.voice.retry')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] flex-1 rounded-control border border-line text-base font-semibold text-ink active:bg-brand-tint"
                >
                  {t('common.close')}
                </button>
              </div>
              <p className="mt-3 text-center text-[13px] text-ink-muted">
                {t('billing.emptyBody')}
              </p>
            </div>
          )}

          {phase === 'draft' && (
            <div className="py-2">
              <h3 className="text-sm font-semibold text-ink">
                <T {...bi('billing.voice.draftTitle')} />
              </h3>
              <div className="mt-2 rounded-control bg-brand-tint px-3 py-2">
                <p className="text-[12px] font-semibold text-brand">{t('billing.heard')}</p>
                <p className="mt-0.5 text-sm text-ink">{transcript || '—'}</p>
              </div>

              <ul className="mt-3 space-y-2">
                {rows.map((row) => {
                  const product = row.productId ? productById.get(row.productId) : undefined
                  const unit = product?.unit ?? normalizeUnit(row.spokenUnit)
                  const lineTotal = product
                    ? lineTotalPaise(product.sell_price, row.qtyMilli)
                    : null
                  const canTeach =
                    product !== undefined &&
                    !row.taught &&
                    !productHasSpokenName(product, row.spokenName)

                  return (
                    <li
                      key={row.key}
                      className={`rounded-control border p-3 ${
                        product ? 'border-line bg-surface' : 'border-warning bg-warning-soft'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-base font-semibold text-ink">
                          “{row.spokenName}”
                        </p>
                        {row.confidence < AUTO_MATCH_MIN_CONFIDENCE && (
                          <span className="shrink-0 rounded-full bg-warning px-2 py-1 text-[11px] font-semibold text-white">
                            {t('billing.voice.lowConfidence')}
                          </span>
                        )}
                      </div>

                      {product ? (
                        <div className="mt-1">
                          <T
                            className="text-sm font-semibold text-ink"
                            ta={product.name_ta ?? product.name}
                            en={product.name}
                          />
                          <span className="mt-0.5 block text-[13px] text-ink-muted">
                            {formatMoney(product.sell_price)} / {t(UNIT_KEYS[product.unit])}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-warning">
                          {t('billing.voice.pick')}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openQty(row)}
                          className="min-h-[48px] rounded-control border border-line bg-page px-3 text-base font-semibold tabular-nums text-ink active:bg-brand-tint"
                        >
                          {formatQty(row.qtyMilli)} {t(UNIT_KEYS[unit])}
                        </button>
                        <span className="ml-auto text-base font-semibold tabular-nums text-ink">
                          {lineTotal === null ? '—' : formatMoney(lineTotal)}
                        </span>
                      </div>

                      {row.candidates.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[12px] font-medium text-ink-muted">
                            {t('billing.voice.alternatives')}
                          </p>
                          <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
                            {row.candidates.map(({ product: candidate }) => {
                              const selected = row.productId === candidate.id
                              return (
                                <button
                                  key={candidate.id}
                                  type="button"
                                  onClick={() => pickProduct(row.key, candidate)}
                                  className={`flex min-h-[48px] shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold ${
                                    selected
                                      ? 'border-brand bg-brand text-white'
                                      : 'border-line bg-surface text-ink active:bg-brand-tint'
                                  }`}
                                >
                                  <T
                                    ta={candidate.name_ta ?? candidate.name}
                                    en={candidate.name}
                                  />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSearchKey(row.key)}
                          className="min-h-[48px] rounded-control border border-line px-3 text-[13px] font-semibold text-ink active:bg-brand-tint"
                        >
                          {t('billing.voice.otherItem')}
                        </button>
                        {canTeach && product && (
                          <button
                            type="button"
                            onClick={() => void teach(row, product)}
                            className="min-h-[48px] rounded-control border border-brand px-3 text-[13px] font-semibold text-brand active:bg-brand-tint"
                          >
                            <T {...biVars('billing.voice.teach', { word: row.spokenName })} />
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              <button
                type="button"
                onClick={confirm}
                disabled={!allResolved}
                className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-control bg-brand px-4 text-lg font-semibold text-white active:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <T {...bi('billing.voice.addToBill')} />
                <span className="tabular-nums">{formatMoney(totalPaise)}</span>
              </button>
              {!allResolved && (
                <p className="mt-2 text-center text-[13px] text-warning">
                  {t('billing.voice.confirmHint')}
                </p>
              )}
            </div>
          )}
        </div>

        <NumberPad
          open={padRow !== null}
          title={t('billing.qty')}
          value={padValue}
          allowDecimal={padUnit === 'kg' || padUnit === 'l'}
          maxDecimals={3}
          suffix={t(UNIT_KEYS[padUnit])}
          error={padError}
          doneLabel={t('common.done')}
          onChange={setPadValue}
          onDone={commitQty}
          onClose={() => {
            setPadKey(null)
            setPadError(null)
          }}
        />

        <SearchSheet
          open={searchKey !== null}
          products={activeProducts}
          onPick={(picked) => {
            if (searchKey) pickProduct(searchKey, picked)
            setSearchKey(null)
          }}
          onClose={() => setSearchKey(null)}
        />
      </div>
    </div>
  )
}
