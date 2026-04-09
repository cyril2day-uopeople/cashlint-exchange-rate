import { bind, err, map, mapError, ok, sequence, type Result } from '@/domain-core/shared-kernel/result'
import { createValidationError, type AppError, type ValidationError } from '@/domain-core/shared-kernel/errors'
import {
  createCurrency,
  createCurrencyPair,
  createDateRange,
  createPositiveNumber,
  type CurrencyPair,
  type DateRange,
  type ExchangeRate,
} from '@/domain-core/shared-kernel/types'
import type {
  EstimateBidAskCommand,
  QuickConvertCommand,
} from '@/domain-core/rate-conversion/types'
import type {
  FetchHistoricalRatesCommand,
  FetchHistoricalRatesCommand as RateAnalysisCommand,
} from '@/domain-core/rate-analysis/types'
import type {
  EstimateBidAskRequestDTO,
  ExchangeRateDTO,
  HistoricalRatesRequestDTO,
  QuickConvertRequestDTO,
  RateAnalysisRequestDTO,
} from '@/dtos'

function buildDateResult(dateText: string, field: string): Result<Date, ValidationError> {
  const parsedDate = new Date(dateText)

  if (Number.isNaN(parsedDate.getTime())) {
    return err(
      createValidationError('InvalidDateRange', field, 'Date must be a valid ISO date'),
    )
  }

  return ok(parsedDate)
}

function widenValidationError<T>(
  result: Result<T, ValidationError>,
): Result<T, AppError> {
  return mapError(result, (error): AppError => error)
}

function buildCurrencyPairResult(
  base: string,
  quote: string,
): Result<CurrencyPair, AppError> {
  return bind(
    widenValidationError(sequence([createCurrency(base), createCurrency(quote)])),
    ([fromCurrency, toCurrency]) => createCurrencyPair(fromCurrency, toCurrency),
  )
}

function buildDateRangeResult(
  startDate: string,
  endDate: string,
): Result<DateRange, AppError> {
  return bind(
    widenValidationError(
      sequence([
        buildDateResult(startDate, 'startDate'),
        buildDateResult(endDate, 'endDate'),
      ]),
    ),
    ([start, end]) => widenValidationError(createDateRange(start, end)),
  )
}

export function buildQuickConvertCommandResult(
  input: QuickConvertRequestDTO,
): Result<QuickConvertCommand, AppError> {
  return bind(widenValidationError(createPositiveNumber(input.amount)), (amount) =>
    map(buildCurrencyPairResult(input.from, input.to), (pair) => ({
      amount,
      fromCurrency: pair.base,
      toCurrency: pair.quote,
    })),
  )
}

export function buildEstimateBidAskCommandResult(
  input: EstimateBidAskRequestDTO,
): Result<EstimateBidAskCommand, AppError> {
  return map(buildExchangeRateResult(input.rate), (exchangeRate) => ({
    exchangeRate,
    spreadType: input.spreadType,
  }))
}

export function buildHistoricalRatesCommandResult(
  input: HistoricalRatesRequestDTO,
): Result<FetchHistoricalRatesCommand, AppError> {
  return bind(buildCurrencyPairResult(input.base, input.quote), (pair) =>
    map(buildDateRangeResult(input.startDate, input.endDate), (dateRange) => ({
      pair,
      dateRange,
    })),
  )
}

export function buildRateAnalysisCommandResult(
  input: RateAnalysisRequestDTO,
): Result<RateAnalysisCommand, AppError> {
  return buildHistoricalRatesCommandResult(input)
}

export function buildExchangeRateResult(
  input: ExchangeRateDTO,
): Result<ExchangeRate, AppError> {
  return bind(buildCurrencyPairResult(input.base, input.quote), (pair) =>
    bind(widenValidationError(createPositiveNumber(input.rate)), (rate) =>
      bind(widenValidationError(buildDateResult(input.date, 'date')), (timestamp) =>
        ok({
          pair,
          rate,
          timestamp,
          source: input.source,
        }),
      ),
    ),
  )
}