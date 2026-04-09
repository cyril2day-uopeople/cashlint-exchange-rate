import { err, ok, type Result } from './result'

type Brand<T, TBrand extends string> = T & {
  readonly __brand: TBrand
}

export type PositiveNumber = Brand<number, 'PositiveNumber'>

export type NonNegativeNumber = Brand<number, 'NonNegativeNumber'>

export type CurrencyCode = Brand<string, 'CurrencyCode'>

export type Currency = {
  readonly code: CurrencyCode
}

export type CurrencyPair = {
  readonly base: Currency
  readonly quote: Currency
}

export type DateRange = {
  readonly start: Date
  readonly end: Date
}

export type Money = {
  readonly amount: NonNegativeNumber
  readonly currency: Currency
}

export type ExchangeRate = {
  readonly pair: CurrencyPair
  readonly rate: PositiveNumber
  readonly timestamp: Date
  readonly source: string
}

export type SupportedCurrency = {
  readonly code: string
  readonly name: string
}

export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'MXN', name: 'Mexican Peso' },
] as const

const SUPPORTED_CURRENCY_CODES = new Set(
  SUPPORTED_CURRENCIES.map((currency) => currency.code),
)

export type ValidationErrorCode =
  | 'MustBePositive'
  | 'MustBeFinite'
  | 'MustBeNumber'
  | 'InvalidCurrency'
  | 'SameCurrencyConversion'
  | 'InvalidDateRange'
  | 'FutureDate'

export type ValidationError = {
  readonly code: ValidationErrorCode
  readonly field?: string
}

export function unsafeCreatePositiveNumber(value: number): PositiveNumber {
  return value as PositiveNumber
}

export function unsafeCreateNonNegativeNumber(value: number): NonNegativeNumber {
  return value as NonNegativeNumber
}

export function createPositiveNumber(
  value: number,
): Result<PositiveNumber, ValidationError> {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return err({ code: 'MustBeNumber' })
  }

  if (!Number.isFinite(value)) {
    return err({ code: 'MustBeFinite' })
  }

  if (value <= 0) {
    return err({ code: 'MustBePositive' })
  }

  return ok(unsafeCreatePositiveNumber(value))
}

export function createCurrency(code: string): Result<Currency, ValidationError> {
  if (typeof code !== 'string' || !/^[A-Z]{3}$/.test(code)) {
    return err({ code: 'InvalidCurrency' })
  }

  if (!SUPPORTED_CURRENCY_CODES.has(code)) {
    return err({ code: 'InvalidCurrency' })
  }

  return ok({
    code: code as CurrencyCode,
  })
}

export function createCurrencyPair(
  base: Currency,
  quote: Currency,
): Result<CurrencyPair, ValidationError> {
  if (base.code === quote.code) {
    return err({ code: 'SameCurrencyConversion' })
  }

  return ok({
    base,
    quote,
  })
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

export function createDateRange(
  start: Date,
  end: Date,
): Result<DateRange, ValidationError> {
  if (!isValidDate(start) || !isValidDate(end)) {
    return err({ code: 'InvalidDateRange' })
  }

  if (start.getTime() > end.getTime()) {
    return err({ code: 'InvalidDateRange' })
  }

  if (end.getTime() > Date.now()) {
    return err({ code: 'FutureDate' })
  }

  return ok({
    start: new Date(start.getTime()),
    end: new Date(end.getTime()),
  })
}

export function invertPair(pair: CurrencyPair): CurrencyPair {
  return {
    base: pair.quote,
    quote: pair.base,
  }
}

export function formatMoney(money: Money): string {
  return `${money.amount.toFixed(2)} ${money.currency.code}`
}