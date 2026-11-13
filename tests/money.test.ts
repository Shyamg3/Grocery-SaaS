import { describe, expect, it } from 'vitest'
import { formatMoney, paiseFromNumeric, rupeesFromPaise, toPaise } from '../src/lib/money'

describe('toPaise', () => {
  it('parses plain rupees', () => {
    expect(toPaise('55')).toBe(5500)
    expect(toPaise('0')).toBe(0)
  })

  it('parses two-decimal rupees', () => {
    expect(toPaise('55.99')).toBe(5599)
    expect(toPaise('0.05')).toBe(5)
    expect(toPaise('1234.56')).toBe(123456)
  })

  it('pads a single decimal digit', () => {
    expect(toPaise('55.9')).toBe(5590)
    expect(toPaise('0.5')).toBe(50)
  })

  it('trims surrounding whitespace', () => {
    expect(toPaise(' 12.50 ')).toBe(1250)
  })

  it('rejects invalid or negative input', () => {
    expect(toPaise('abc')).toBeNull()
    expect(toPaise('-5')).toBeNull()
    expect(toPaise('5.999')).toBeNull()
    expect(toPaise('')).toBeNull()
    expect(toPaise('1,000')).toBeNull()
  })

  it('handles boundary spellings without float math', () => {
    expect(toPaise('0.00')).toBe(0)
    expect(toPaise('00.5')).toBe(50)
    expect(toPaise('005')).toBe(500)
    expect(toPaise('.5')).toBeNull()
    expect(toPaise('5.')).toBeNull()
    expect(toPaise('+5')).toBeNull()
    expect(toPaise('999999999999.99')).toBe(99999999999999)
  })
})

describe('rupeesFromPaise', () => {
  it('formats paise as a two-decimal rupee string', () => {
    expect(rupeesFromPaise(5599)).toBe('55.99')
    expect(rupeesFromPaise(5500)).toBe('55.00')
    expect(rupeesFromPaise(5)).toBe('0.05')
    expect(rupeesFromPaise(0)).toBe('0.00')
    expect(rupeesFromPaise(123456)).toBe('1234.56')
  })

  it('handles negative paise', () => {
    expect(rupeesFromPaise(-5599)).toBe('-55.99')
  })

  it('rounds fractional paise before formatting', () => {
    expect(rupeesFromPaise(1.4)).toBe('0.01')
    expect(rupeesFromPaise(5599.6)).toBe('56.00')
    expect(rupeesFromPaise(-5)).toBe('-0.05')
  })
})

describe('formatMoney', () => {
  it('prefixes the rupee sign', () => {
    expect(formatMoney(5599)).toBe('₹55.99')
    expect(formatMoney(0)).toBe('₹0.00')
  })

  it('keeps the minus sign for refunds and corrections', () => {
    expect(formatMoney(-5599)).toBe('₹-55.99')
    expect(formatMoney(-5)).toBe('₹-0.05')
  })
})

describe('rupee string round trip', () => {
  it('toPaise and rupeesFromPaise are inverses', () => {
    for (const s of ['0', '7', '0.99', '45.5', '99999.99']) {
      expect(rupeesFromPaise(toPaise(s)!)).toBe(Number(s).toFixed(2))
    }
  })
})

describe('paiseFromNumeric', () => {
  it('parses Postgres numeric strings exactly', () => {
    expect(paiseFromNumeric('83.99')).toBe(8399)
    expect(paiseFromNumeric('83.9')).toBe(8390)
    expect(paiseFromNumeric('83.990')).toBe(8399)
    expect(paiseFromNumeric('1200')).toBe(120000)
    expect(paiseFromNumeric('0.05')).toBe(5)
  })

  it('keeps the sign and rejects junk', () => {
    expect(paiseFromNumeric('-137.50')).toBe(-13750)
    expect(paiseFromNumeric('abc')).toBeNull()
    expect(paiseFromNumeric('')).toBeNull()
  })

  it('truncates beyond two decimals instead of rounding', () => {
    expect(paiseFromNumeric('83.995')).toBe(8399)
    expect(paiseFromNumeric('-83.999')).toBe(-8399)
  })

  it('accepts whole numbers, whitespace and numeric input', () => {
    expect(paiseFromNumeric('83')).toBe(8300)
    expect(paiseFromNumeric(' 1200 ')).toBe(120000)
    expect(paiseFromNumeric(83.9)).toBe(8390)
    expect(paiseFromNumeric(0)).toBe(0)
  })

  it('rejects malformed numeric strings', () => {
    expect(paiseFromNumeric('5.')).toBeNull()
    expect(paiseFromNumeric('+5')).toBeNull()
    expect(paiseFromNumeric('1e3')).toBeNull()
    expect(paiseFromNumeric('1,000.00')).toBeNull()
  })
})
