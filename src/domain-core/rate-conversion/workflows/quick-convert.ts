import { compose, divide, multiply } from 'ramda'

import { err, fold, map, ok, type Result } from '@/domain-core/shared-kernel/result'
import { type AppError } from '@/domain-core/shared-kernel/errors'
import {
  createCurrencyPair,
  unsafeCreateNonNegativeNumber,
  unsafeCreatePositiveNumber,
  type Currency,
  type CurrencyPair,
  type ExchangeRate,
  type Money,
  type PositiveNumber,
} from '@/domain-core/shared-kernel/types'
import type {
  ConversionResult,
  FetchRate,
  QuickConvertCommand,
} from '@/domain-core/rate-conversion/types'

function buildMoney(amount: number, currency: Currency): Money {
  return {
    amount: unsafeCreateNonNegativeNumber(amount),
    currency,
  }
}

function calculateConvertedAmount(
  amount: PositiveNumber,
  rate: PositiveNumber,
): number {
  return multiply(amount, rate)
}

function calculateInverseRate(rate: PositiveNumber): PositiveNumber {
  return compose(unsafeCreatePositiveNumber, divide(1))(rate)
}

function buildConversionResult(
  command: QuickConvertCommand,
  exchangeRate: ExchangeRate,
  calculatedAt: Date,
): ConversionResult {
  const convertedAmount = calculateConvertedAmount(
    command.amount,
    exchangeRate.rate,
  )

  return {
    from: buildMoney(command.amount, command.fromCurrency),
    to: buildMoney(convertedAmount, command.toCurrency),
    rate: exchangeRate,
    inverseRate: calculateInverseRate(exchangeRate.rate),
    calculatedAt,
  }
}

function createConversionResult(
  command: QuickConvertCommand,
  calculatedAt: Date,
): (exchangeRate: ExchangeRate) => ConversionResult {
  return (exchangeRate) =>
    buildConversionResult(command, exchangeRate, calculatedAt)
}

async function toFailedResult(
  error: AppError,
): Promise<Result<ConversionResult, AppError>> {
  return err(error)
}

async function convertFetchedRate(
  command: QuickConvertCommand,
  fetchRate: FetchRate,
  pair: CurrencyPair,
): Promise<Result<ConversionResult, AppError>> {
  const exchangeRateResult = await fetchRate(pair)

  return map(
    exchangeRateResult,
    createConversionResult(command, new Date()),
  )
}

export function quickConvert(fetchRate: FetchRate) {
  return async (
    command: QuickConvertCommand,
  ): Promise<Result<ConversionResult, AppError>> => {
    return fold(
      createCurrencyPair(command.fromCurrency, command.toCurrency),
      toFailedResult,
      (pair) => convertFetchedRate(command, fetchRate, pair),
    )
  }
}