import 'server-only'

import { sortBy } from 'ramda'

import { createInfrastructureError, type InfrastructureError } from '@/domain-core/shared-kernel/errors'
import { bind, err, map, mapError, ok, sequence, type Result } from '@/domain-core/shared-kernel/result'
import {
  type CurrencyPair,
  type DateRange,
  type ExchangeRate,
  type PositiveNumber,
  createPositiveNumber,
} from '@/domain-core/shared-kernel/types'
import type { FetchRateSeries, RateSeries } from '@/domain-core/rate-analysis/types'
import type { FetchRate } from '@/domain-core/rate-conversion/types'
import {
  fetchHistorical,
  fetchRate,
  type FrankfurterRateResponse,
  type FrankfurterRateSeriesResponse,
} from '@/infrastructure/frankfurter/client'

const FRANKFURTER_SOURCE = 'Frankfurter'

function createUnexpectedShapeError(message: string, cause?: unknown): InfrastructureError {
  return createInfrastructureError('UnexpectedResponseShape', message, cause)
}

function parseDate(dateText: string): Result<Date, InfrastructureError> {
  const parsedDate = new Date(`${dateText}T00:00:00Z`)

  if (Number.isNaN(parsedDate.getTime())) {
    return err(createUnexpectedShapeError('Frankfurter returned an invalid date'))
  }

  return ok(parsedDate)
}

function createPositiveRateResult(
  rate: number,
): Result<PositiveNumber, InfrastructureError> {
  return mapError(createPositiveNumber(rate), () =>
    createUnexpectedShapeError('Frankfurter returned a non-positive rate'),
  )
}

function translateRateRecord(
  expectedPair: CurrencyPair,
  response: FrankfurterRateResponse,
): Result<ExchangeRate, InfrastructureError> {
  if (
    response.base !== expectedPair.base.code ||
    response.quote !== expectedPair.quote.code
  ) {
    return err(
      createUnexpectedShapeError(
        'Frankfurter returned a currency pair that does not match the request',
      ),
    )
  }

  return bind(createPositiveRateResult(response.rate), (rate) =>
    bind(parseDate(response.date), (timestamp) =>
      ok({
        pair: expectedPair,
        rate,
        timestamp,
        source: response.source ?? FRANKFURTER_SOURCE,
      }),
    ),
  )
}

function asNonEmptyArray<T>(values: T[]): readonly [T, ...T[]] {
  return values as unknown as readonly [T, ...T[]]
}

function translateRateSeries(
  expectedPair: CurrencyPair,
  dateRange: DateRange,
  responses: FrankfurterRateSeriesResponse,
): Result<RateSeries, InfrastructureError> {
  if (responses.length === 0) {
    return err(
      createInfrastructureError(
        'NoDataForPeriod',
        'No historical data available for the requested period',
      ),
    )
  }

  return map(
    sequence(responses.map((response) => translateRateRecord(expectedPair, response))),
    (rates) => ({
      pair: expectedPair,
      rates: asNonEmptyArray(
        sortBy((rate) => rate.timestamp.getTime(), rates),
      ),
      dateRange,
      source: FRANKFURTER_SOURCE,
    }),
  )
}

export const fetchRateFromFrankfurter: FetchRate = async (pair) => {
  const response = await fetchRate(pair.base.code, pair.quote.code)

  return bind(response, (frankfurterResponse) =>
    translateRateRecord(pair, frankfurterResponse),
  )
}

export const fetchRateSeriesFromFrankfurter: FetchRateSeries = async (
  pair,
  dateRange,
) => {
  const response = await fetchHistorical(
    pair.base.code,
    pair.quote.code,
    dateRange.start.toISOString().slice(0, 10),
    dateRange.end.toISOString().slice(0, 10),
  )

  return bind(response, (frankfurterResponse) =>
    translateRateSeries(pair, dateRange, frankfurterResponse),
  )
}