import { describe, expect, it } from 'vitest'

import { err, isOk, ok, type Result } from './result'
import {
  createCurrency,
  createCurrencyPair,
  createDateRange,
  formatMoney,
  invertPair,
  createPositiveNumber,
  SUPPORTED_CURRENCIES,
  type Currency,
  type CurrencyCode,
  type CurrencyPair,
  type DateRange,
  type Money,
  type PositiveNumber,
  type ValidationError,
  unsafeCreateNonNegativeNumber,
  unsafeCreatePositiveNumber,
} from './types'

function unwrapOk<T>(result: Result<T, ValidationError>): T {
  if (!isOk(result)) {
    throw new Error(`Expected ok result, got ${result.error.code}`)
  }

  return result.value
}

function currencyCode(code: string): CurrencyCode {
  return code as CurrencyCode
}

describe('positiveNumber', () => {
  it('accepts positive values', () => {
    expect(createPositiveNumber(42)).toEqual(ok(unsafeCreatePositiveNumber(42)))
  })

  it('accepts very small positive values', () => {
    expect(createPositiveNumber(0.0001)).toEqual(
      ok(unsafeCreatePositiveNumber(0.0001)),
    )
  })

  it('rejects zero', () => {
    expect(createPositiveNumber(0)).toEqual(err({ code: 'MustBePositive' }))
  })

  it('rejects negative values', () => {
    expect(createPositiveNumber(-5)).toEqual(err({ code: 'MustBePositive' }))
  })

  it('rejects infinity', () => {
    expect(createPositiveNumber(Number.POSITIVE_INFINITY)).toEqual(
      err({ code: 'MustBeFinite' }),
    )
  })

  it('rejects negative infinity', () => {
    expect(createPositiveNumber(Number.NEGATIVE_INFINITY)).toEqual(
      err({ code: 'MustBeFinite' }),
    )
  })

  it('rejects NaN', () => {
    expect(createPositiveNumber(Number.NaN)).toEqual(err({ code: 'MustBeNumber' }))
  })
})

describe('currency', () => {
  it('accepts supported uppercase currencies', () => {
    const result = createCurrency('EUR')

    expect(result).toEqual(
      ok({
        code: currencyCode('EUR'),
      }),
    )
  })

  it('rejects lowercase currency codes', () => {
    expect(createCurrency('eur')).toEqual(err({ code: 'InvalidCurrency' }))
  })

  it('rejects invalid length codes', () => {
    expect(createCurrency('EURO')).toEqual(err({ code: 'InvalidCurrency' }))
    expect(createCurrency('EU')).toEqual(err({ code: 'InvalidCurrency' }))
  })

  it('rejects unknown currencies', () => {
    expect(createCurrency('XXX')).toEqual(err({ code: 'InvalidCurrency' }))
  })

  it('rejects empty strings', () => {
    expect(createCurrency('')).toEqual(err({ code: 'InvalidCurrency' }))
  })
})

describe('currencyPair', () => {
  it('accepts different currencies', () => {
    const eur = unwrapOk(createCurrency('EUR'))
    const usd = unwrapOk(createCurrency('USD'))

    expect(createCurrencyPair(eur, usd)).toEqual(ok({ base: eur, quote: usd }))
  })

  it('rejects same currencies', () => {
    const eur = unwrapOk(createCurrency('EUR'))

    expect(createCurrencyPair(eur, eur)).toEqual(
      err({ code: 'SameCurrencyConversion' }),
    )
  })
})

describe('dateRange', () => {
  it('accepts a valid date range', () => {
    const start = new Date('2026-01-01T00:00:00Z')
    const end = new Date('2026-01-31T00:00:00Z')

    expect(createDateRange(start, end)).toEqual(ok({ start, end }))
  })

  it('accepts the same start and end date', () => {
    const day = new Date('2026-01-01T00:00:00Z')

    expect(createDateRange(day, day)).toEqual(ok({ start: day, end: day }))
  })

  it('rejects inverted dates', () => {
    const start = new Date('2026-01-31T00:00:00Z')
    const end = new Date('2026-01-01T00:00:00Z')

    expect(createDateRange(start, end)).toEqual(err({ code: 'InvalidDateRange' }))
  })

  it('rejects future end dates', () => {
    const start = new Date('2026-01-01T00:00:00Z')
    const end = new Date('2099-01-01T00:00:00Z')

    expect(createDateRange(start, end)).toEqual(err({ code: 'FutureDate' }))
  })
})

describe('invertPair', () => {
  it('swaps base and quote currencies', () => {
    const eur = unwrapOk(createCurrency('EUR'))
    const usd = unwrapOk(createCurrency('USD'))
    const pair = unwrapOk(createCurrencyPair(eur, usd))

    expect(invertPair(pair)).toEqual({ base: usd, quote: eur })
  })

  it('returns the original pair when inverted twice', () => {
    const eur = unwrapOk(createCurrency('EUR'))
    const usd = unwrapOk(createCurrency('USD'))
    const pair = unwrapOk(createCurrencyPair(eur, usd))

    expect(invertPair(invertPair(pair))).toEqual(pair)
  })
})

describe('formatMoney', () => {
  it('formats money with two decimal places', () => {
    const eur = unwrapOk(createCurrency('EUR'))
    const money: Money = {
      amount: unsafeCreateNonNegativeNumber(100),
      currency: eur,
    }

    expect(formatMoney(money)).toBe('100.00 EUR')
  })

  it('formats zero money amounts', () => {
    const usd = unwrapOk(createCurrency('USD'))
    const money: Money = {
      amount: unsafeCreateNonNegativeNumber(0),
      currency: usd,
    }

    expect(formatMoney(money)).toBe('0.00 USD')
  })
})

describe('shared kernel exports', () => {
  it('exports the supported currency list', () => {
    expect(SUPPORTED_CURRENCIES.length).toBeGreaterThan(0)
    expect(SUPPORTED_CURRENCIES[0]?.code).toBe('USD')
  })
})