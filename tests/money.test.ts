import { describe, expect, it } from 'vitest'
import { formatMoney, rupeesFromPaise, toPaise } from '../src/lib/money'

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
})

describe('formatMoney', () => {
  it('prefixes the rupee sign', () => {
    expect(formatMoney(5599)).toBe('₹55.99')
    expect(formatMoney(0)).toBe('₹0.00')
  })
})

describe('rupee string round trip', () => {
  it('toPaise and rupeesFromPaise are inverses', () => {
    for (const s of ['0', '7', '0.99', '45.5', '99999.99']) {
      expect(rupeesFromPaise(toPaise(s)!)).toBe(Number(s).toFixed(2))
    }
  })
})
