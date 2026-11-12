import { useState, type ChangeEvent } from 'react'
import { mapAuthError } from '../features/auth/AuthProvider'
import { parseCsv } from '../lib/csv'
import { t, type StringKey } from '../lib/i18n'
import { toPaise } from '../lib/money'
import { rupeesFromPaise } from '../lib/money'
import { UNITS, type Unit } from '../lib/products'
import { supabase } from '../lib/supabase'

interface Props {
  shopId: string
  existingNames: Set<string>
  onDone: (importedCount: number) => void
  onCancel: () => void
}

interface ValidRow {
  name: string
  name_ta: string | null
  unit: Unit
  sellPricePaise: number
  stockQty: number
}

interface BadRow {
  line: number
  reason: StringKey
  cells: string[]
}

interface Parsed {
  valid: ValidRow[]
  bad: BadRow[]
}

function cell(cells: string[], index: number): string {
  return index >= 0 && index < cells.length ? cells[index].trim() : ''
}

function parseFile(text: string, existingNames: Set<string>): { parsed: Parsed | null; headerBad: boolean } {
  const rows = parseCsv(text)
  if (rows.length < 2) return { parsed: null, headerBad: true }
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idx = {
    name: header.indexOf('name'),
    nameTa: header.indexOf('name_ta'),
    unit: header.indexOf('unit'),
    price: header.indexOf('sell_price'),
    stock: header.indexOf('stock'),
  }
  if (idx.name < 0 || idx.price < 0) return { parsed: null, headerBad: true }

  const valid: ValidRow[] = []
  const bad: BadRow[] = []
  const seen = new Set<string>()

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]
    const line = i + 1
    const name = cell(cells, idx.name)
    if (name === '') {
      bad.push({ line, reason: 'import.err.name', cells })
      continue
    }
    const lower = name.toLowerCase()
    if (existingNames.has(lower) || seen.has(lower)) {
      bad.push({ line, reason: 'import.err.duplicate', cells })
      continue
    }
    let unit: Unit = 'pcs'
    const rawUnit = cell(cells, idx.unit).toLowerCase()
    if (rawUnit !== '') {
      if (!(UNITS as readonly string[]).includes(rawUnit)) {
        bad.push({ line, reason: 'import.err.unit', cells })
        continue
      }
      unit = rawUnit as Unit
    }
    const price = toPaise(cell(cells, idx.price))
    if (price === null) {
      bad.push({ line, reason: 'import.err.price', cells })
      continue
    }
    const stockRaw = cell(cells, idx.stock)
    let stock = 0
    if (stockRaw !== '') {
      const n = Number(stockRaw)
      if (!Number.isFinite(n) || n < 0) {
        bad.push({ line, reason: 'import.err.stock', cells })
        continue
      }
      stock = n
    }
    seen.add(lower)
    valid.push({
      name,
      name_ta: cell(cells, idx.nameTa) || null,
      unit,
      sellPricePaise: price,
      stockQty: stock,
    })
  }
  return { parsed: { valid, bad }, headerBad: false }
}

export default function CsvImport({ shopId, existingNames, onDone, onCancel }: Props) {
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [headerBad, setHeaderBad] = useState(false)
  const [errorKey, setErrorKey] = useState<StringKey | null>(null)
  const [busy, setBusy] = useState(false)

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setErrorKey(null)
    setHeaderBad(false)
    setParsed(null)
    const file = event.target.files?.[0]
    if (!file) return
    void file
      .text()
      .then((text) => {
        const result = parseFile(text, existingNames)
        setHeaderBad(result.headerBad)
        setParsed(result.parsed)
      })
      .catch(() => setErrorKey('error.generic'))
  }

  async function handleImport() {
    if (!parsed || parsed.valid.length === 0 || busy) return
    setBusy(true)
    setErrorKey(null)
    try {
      const rows = parsed.valid.map((r) => ({
        shop_id: shopId,
        name: r.name,
        name_ta: r.name_ta,
        aliases: [],
        unit: r.unit,
        sell_price: rupeesFromPaise(r.sellPricePaise),
        stock_qty: String(r.stockQty),
      }))
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase.from('products').insert(rows.slice(i, i + 100))
        if (error) throw new Error(error.message)
      }
      onDone(parsed.valid.length)
    } catch (err) {
      setErrorKey(mapAuthError(err instanceof Error ? err.message : String(err)))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <h1 className="text-xl font-bold">{t('import.title')}</h1>
      <p className="text-sm text-neutral-500">{t('import.format')}</p>

      {errorKey && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          {t(errorKey)}
        </div>
      )}
      {headerBad && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          {t('import.badHeader')}
        </div>
      )}

      <label className="flex min-h-[56px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-emerald-500 text-base font-bold text-emerald-700 active:bg-emerald-50">
        {t('import.choose')}
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      </label>

      {parsed && (
        <>
          <div className="flex flex-col gap-1 text-sm font-medium">
            <span className="text-emerald-700">{t('import.validCount', { n: parsed.valid.length })}</span>
            {parsed.bad.length > 0 && <span className="text-red-600">{t('import.errorCount', { n: parsed.bad.length })}</span>}
          </div>

          <ul className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {parsed.bad.map((row) => (
              <li key={row.line} className="flex flex-col gap-0.5 p-3 text-sm">
                <span className="font-medium text-red-600">
                  #{row.line}: {t(row.reason)}
                </span>
                <span className="text-neutral-500">{row.cells.join(', ')}</span>
              </li>
            ))}
            {parsed.valid.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="font-medium">{row.name}</span>
                <span className="text-neutral-500">
                  {rupeesFromPaise(row.sellPricePaise)} · {row.stockQty} {t(`unit.${row.unit}`)}
                </span>
              </li>
            ))}
          </ul>

          {parsed.valid.length > 0 ? (
            <button
              type="button"
              onClick={handleImport}
              disabled={busy}
              className="min-h-[56px] rounded-xl bg-emerald-600 text-lg font-bold text-white active:bg-emerald-700 disabled:opacity-50"
            >
              {t('import.importBtn', { n: parsed.valid.length })}
            </button>
          ) : (
            <div className="rounded-xl bg-neutral-50 p-3 text-center text-sm text-neutral-500">
              {t('import.noValid')}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="min-h-[48px] rounded-xl border border-neutral-300 text-base font-bold text-neutral-700 active:bg-neutral-100 disabled:opacity-50"
      >
        {t('common.cancel')}
      </button>
    </div>
  )
}
