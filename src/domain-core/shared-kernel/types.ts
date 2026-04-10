import { complement, cond, ifElse, T, test } from 'ramda'

import { err, ok, type Result } from '@/domain-core/shared-kernel/result'
import {
  createDomainError,
  createValidationError,
  type DomainError,
  type ValidationError,
} from '@/domain-core/shared-kernel/errors'

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
  { code: 'PHP', name: 'Philippine Peso' },
] as const

const SUPPORTED_CURRENCY_CODES = new Set(
  SUPPORTED_CURRENCIES.map((currency) => currency.code),
)

function createMustBeNumberResult(): Result<PositiveNumber, ValidationError> {
  return err(createValidationError('MustBeNumber', 'Value must be a number'))
}

function createMustBeFiniteResult(): Result<PositiveNumber, ValidationError> {
  return err(createValidationError('MustBeFinite', 'Value must be finite'))
}

function createMustBePositiveResult(): Result<PositiveNumber, ValidationError> {
  return err(
    createValidationError('MustBePositive', 'Value must be greater than zero'),
  )
}

function createPositiveNumberResult(
  positiveValue: number,
): Result<PositiveNumber, ValidationError> {
  return ok(unsafeCreatePositiveNumber(positiveValue))
}

const isFiniteNumber = complement(Number.isFinite)
const isPositiveNumber = (value: number) => value > 0

const buildPositiveNumberResult = cond([
  [Number.isNaN, createMustBeNumberResult],
  [isFiniteNumber, createMustBeFiniteResult],
  [(value: number) => !isPositiveNumber(value), createMustBePositiveResult],
  [T, createPositiveNumberResult],
]) as (value: number) => Result<PositiveNumber, ValidationError>

const isCurrencyCodeFormat = test(/^[A-Z]{3}$/)
const isSupportedCurrencyCode = (code: string) => SUPPORTED_CURRENCY_CODES.has(code)

const isCurrencyCodeValid = (code: string) =>
  isCurrencyCodeFormat(code) && isSupportedCurrencyCode(code)

function createInvalidCurrencyResult(): Result<Currency, ValidationError> {
  return err(
    createValidationError(
      'InvalidCurrency',
      'Currency code must be a supported 3-letter uppercase ISO 4217 code',
    ),
  )
}

function createCurrencyResult(code: string): Result<Currency, ValidationError> {
  return ok({
    code: code as CurrencyCode,
  })
}

const buildCurrencyResult = ifElse(
  isCurrencyCodeValid,
  createCurrencyResult,
  createInvalidCurrencyResult,
)

export function unsafeCreatePositiveNumber(value: number): PositiveNumber {
  return value as PositiveNumber
}

export function unsafeCreateNonNegativeNumber(value: number): NonNegativeNumber {
  return value as NonNegativeNumber
}

export function createPositiveNumber(
  value: number,
): Result<PositiveNumber, ValidationError> {
  return buildPositiveNumberResult(value)
}

export function createCurrency(code: string): Result<Currency, ValidationError> {
  return buildCurrencyResult(code)
}

export function createCurrencyPair(
  base: Currency,
  quote: Currency,
): Result<CurrencyPair, DomainError> {
  if (base.code === quote.code) {
    return err(
      createDomainError(
        'SameCurrencyConversion',
        'Base and quote currencies must differ',
        'pair',
      ),
    )
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
    return err(
      createValidationError(
        'InvalidDateRange',
        'Start date must be on or before end date',
      ),
    )
  }

  if (start.getTime() > end.getTime()) {
    return err(
      createValidationError(
        'InvalidDateRange',
        'Start date must be on or before end date',
      ),
    )
  }

  if (end.getTime() > Date.now()) {
    return err(
      createValidationError(
        'FutureDate',
        'End date cannot be in the future',
      ),
    )
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