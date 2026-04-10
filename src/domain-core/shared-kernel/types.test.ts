import { describe, expect, it } from 'vitest'

import { err, isOk, ok, type Result } from '@/domain-core/shared-kernel/result'
import {
  createCurrency,
  createCurrencyPair,
  createDateRange,
  createPositiveNumber,
  formatMoney,
  invertPair,
  SUPPORTED_CURRENCIES,
  type Currency,
  type CurrencyCode,
  type CurrencyPair,
  type DateRange,
  type Money,
  type PositiveNumber,
  unsafeCreateNonNegativeNumber,
  unsafeCreatePositiveNumber,
} from '@/domain-core/shared-kernel/types'
import {
  createDomainError,
  createValidationError,
} from '@/domain-core/shared-kernel/errors'

function unwrapOk<T, E>(result: Result<T, E>): T {
  if (!isOk(result)) {
    throw new Error('Expected ok result')
  }

  return result.value
}

function currencyCode(code: string): CurrencyCode {
  return code as CurrencyCode
}

describe('positiveNumber', () => {
  it('accepts positive values', () => {
    expect(createPositiveNumber(42)).toEqual(
      ok(unsafeCreatePositiveNumber(42)),
    )
  })

  it('accepts very small positive values', () => {
    expect(createPositiveNumber(0.0001)).toEqual(
      ok(unsafeCreatePositiveNumber(0.0001)),
    )
  })

  it('rejects zero', () => {
    expect(createPositiveNumber(0)).toEqual(
      err(createValidationError('MustBePositive', 'Value must be greater than zero')),
    )
  })

  it('rejects negative values', () => {
    expect(createPositiveNumber(-5)).toEqual(
      err(createValidationError('MustBePositive', 'Value must be greater than zero')),
    )
  })

  it('rejects infinity', () => {
    expect(createPositiveNumber(Number.POSITIVE_INFINITY)).toEqual(
      err(createValidationError('MustBeFinite', 'Value must be finite')),
    )
  })

  it('rejects negative infinity', () => {
    expect(createPositiveNumber(Number.NEGATIVE_INFINITY)).toEqual(
      err(createValidationError('MustBeFinite', 'Value must be finite')),
    )
  })

  it('rejects NaN', () => {
    expect(createPositiveNumber(Number.NaN)).toEqual(
      err(createValidationError('MustBeNumber', 'Value must be a number')),
    )
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

  it('accepts PHP as a supported currency', () => {
    expect(createCurrency('PHP')).toEqual(
      ok({
        code: currencyCode('PHP'),
      }),
    )
  })

  it('rejects lowercase currency codes', () => {
    expect(createCurrency('eur')).toEqual(
      err(
        createValidationError(
          'InvalidCurrency',
          'Currency code must be a supported 3-letter uppercase ISO 4217 code',
        ),
      ),
    )
  })

  it('rejects invalid length codes', () => {
    expect(createCurrency('EURO')).toEqual(
      err(
        createValidationError(
          'InvalidCurrency',
          'Currency code must be a supported 3-letter uppercase ISO 4217 code',
        ),
      ),
    )
    expect(createCurrency('EU')).toEqual(
      err(
        createValidationError(
          'InvalidCurrency',
          'Currency code must be a supported 3-letter uppercase ISO 4217 code',
        ),
      ),
    )
  })

  it('rejects unknown currencies', () => {
    expect(createCurrency('XXX')).toEqual(
      err(
        createValidationError(
          'InvalidCurrency',
          'Currency code must be a supported 3-letter uppercase ISO 4217 code',
        ),
      ),
    )
  })

  it('rejects empty strings', () => {
    expect(createCurrency('')).toEqual(
      err(
        createValidationError(
          'InvalidCurrency',
          'Currency code must be a supported 3-letter uppercase ISO 4217 code',
        ),
      ),
    )
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
      err(
        createDomainError(
          'SameCurrencyConversion',
          'Base and quote currencies must differ',
          'pair',
        ),
      ),
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

    expect(createDateRange(start, end)).toEqual(
      err(
        createValidationError(
          'InvalidDateRange',
          'Start date must be on or before end date',
        ),
      ),
    )
  })

  it('rejects future end dates', () => {
    const start = new Date('2026-01-01T00:00:00Z')
    const end = new Date('2099-01-01T00:00:00Z')

    expect(createDateRange(start, end)).toEqual(
      err(createValidationError('FutureDate', 'End date cannot be in the future')),
    )
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