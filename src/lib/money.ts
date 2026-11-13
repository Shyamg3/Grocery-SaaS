export function toPaise(input: string): number | null {
  const m = /^\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(input)
  if (!m) return null
  const cents = m[2] ? m[2].padEnd(2, '0') : '00'
  return Number(m[1]) * 100 + Number(cents)
}

export function rupeesFromPaise(paise: number): string {
  const sign = paise < 0 ? '-' : ''
  const abs = Math.abs(Math.round(paise))
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

export function formatMoney(paise: number): string {
  return `₹${rupeesFromPaise(paise)}`
}

/** Postgres numeric comes back as a string ("83.99"); parse it into paise without float math. */
export function paiseFromNumeric(input: string | number): number | null {
  const text = typeof input === 'number' ? input.toFixed(2) : input.trim()
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text)
  if (!m) return null
  const paise = Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0').slice(0, 2))
  return m[1] === '-' ? -paise : paise
}
