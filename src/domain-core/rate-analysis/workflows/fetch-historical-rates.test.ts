import { describe, expect, it, vi } from 'vitest'

import { err, ok, type Result } from '@/domain-core/shared-kernel/result'
import {
  createCurrency,
  createCurrencyPair,
  createDateRange,
  unsafeCreatePositiveNumber,
  type Currency,
  type CurrencyPair,
  type ExchangeRate,
} from '@/domain-core/shared-kernel/types'
import { createInfrastructureError } from '@/domain-core/shared-kernel/errors'
import { fetchHistoricalRates } from '@/domain-core/rate-analysis/workflows/fetch-historical-rates'
import type {
  FetchRateSeries,
  RateSeries,
} from '@/domain-core/rate-analysis/types'

function unwrapOk<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value
  }

  throw new Error('Expected ok result')
}

function buildCurrency(code: string): Currency {
  return unwrapOk(createCurrency(code))
}

function buildPair(): CurrencyPair {
  const base = buildCurrency('EUR')
  const quote = buildCurrency('USD')

  return unwrapOk(createCurrencyPair(base, quote))
}

function buildDateRange() {
  return unwrapOk(
    createDateRange(
      new Date('2026-03-01T00:00:00Z'),
      new Date('2026-03-31T00:00:00Z'),
    ),
  )
}

function buildExchangeRate(
  pair: CurrencyPair,
  rate: number,
  dayOffset: number,
): ExchangeRate {
  return {
    pair,
    rate: unsafeCreatePositiveNumber(rate),
    timestamp: new Date(Date.UTC(2026, 2, 1 + dayOffset)),
    source: 'Frankfurter',
  }
}

function buildExchangeRates(
  pair: CurrencyPair,
  rates: readonly [number, ...number[]],
): readonly [ExchangeRate, ...ExchangeRate[]] {
  const [firstRate, ...remainingRates] = rates
  const exchangeRates: [ExchangeRate, ...ExchangeRate[]] = [
    buildExchangeRate(pair, firstRate, 0),
    ...remainingRates.map((rate, index) =>
      buildExchangeRate(pair, rate, index + 1),
    ),
  ]

  return exchangeRates
}

function buildRateSeries(rates: readonly [number, ...number[]]): RateSeries {
  const pair = buildPair()

  return {
    pair,
    rates: buildExchangeRates(pair, rates),
    dateRange: buildDateRange(),
    source: 'Frankfurter',
  }
}

describe('fetchHistoricalRates', () => {
  it('fetches a historical rate series from the dependency', async () => {
    const pair = buildPair()
    const dateRange = buildDateRange()
    const series = buildRateSeries([1.08, 1.05, 1.1])
    const fetchRateSeries: FetchRateSeries = vi.fn(async (incomingPair, incomingRange) => {
      expect(incomingPair).toEqual(pair)
      expect(incomingRange).toEqual(dateRange)

      return ok(series)
    })
    const workflow = fetchHistoricalRates(fetchRateSeries)

    const result = await workflow({
      pair,
      dateRange,
    })

    expect(fetchRateSeries).toHaveBeenCalledTimes(1)
    expect(result).toEqual(ok(series))
  })

  it('propagates infrastructure errors from the dependency', async () => {
    const pair = buildPair()
    const dateRange = buildDateRange()
    const infrastructureError = createInfrastructureError(
      'ExternalServiceUnavailable',
      'Frankfurter is unavailable',
    )
    const fetchRateSeries: FetchRateSeries = vi.fn(async () => err(infrastructureError))
    const workflow = fetchHistoricalRates(fetchRateSeries)

    const result = await workflow({
      pair,
      dateRange,
    })

    expect(fetchRateSeries).toHaveBeenCalledTimes(1)
    expect(result).toEqual(err(infrastructureError))
  })
})