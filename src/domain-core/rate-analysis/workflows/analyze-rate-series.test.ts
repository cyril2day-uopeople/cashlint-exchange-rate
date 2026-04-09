import { describe, expect, it } from 'vitest'

import { err, isErr, type Result } from '@/domain-core/shared-kernel/result'
import {
  createCurrency,
  createCurrencyPair,
  createDateRange,
  unsafeCreatePositiveNumber,
  type Currency,
  type CurrencyPair,
  type ExchangeRate,
} from '@/domain-core/shared-kernel/types'
import { createDomainError } from '@/domain-core/shared-kernel/errors'
import { analyzeRateSeries } from '@/domain-core/rate-analysis/workflows/analyze-rate-series'
import type { RateSeries } from '@/domain-core/rate-analysis/types'

function unwrapOk<T, E>(result: Result<T, E>): T {
  if (isErr(result)) {
    throw new Error('Expected ok result')
  }

  return result.value
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

describe('analyzeRateSeries', () => {
  it('computes statistics, trend, and volatility from a series', () => {
    const series = buildRateSeries([1.08, 1.05, 1.1, 1.09])
    const startedAt = Date.now()

    const result = analyzeRateSeries({ series })

    expect(isErr(result)).toBe(false)

    if (isErr(result)) {
      throw new Error('Expected ok result')
    }

    expect(result.value.series).toBe(series)
    expect(result.value.statistics.current).toBeCloseTo(1.09)
    expect(result.value.statistics.average).toBeCloseTo(1.08)
    expect(result.value.statistics.minimum).toBeCloseTo(1.05)
    expect(result.value.statistics.maximum).toBeCloseTo(1.1)
    expect(result.value.statistics.range).toBeCloseTo(0.05)
    expect(result.value.statistics.dataPoints).toBe(4)
    expect(result.value.trend.direction).toBe('Strengthening')
    expect(result.value.trend.comparedTo).toBe('VsAverage')
    expect(result.value.trend.percentChange).toBeCloseTo(0.9259259)
    expect(result.value.volatility.level).toBe('Medium')
    expect(result.value.volatility.value).toBeCloseTo(4.6296296)
    expect(result.value.volatility.interpretation).toBe(
      'Moderate fluctuation. Consider timing carefully.',
    )
    expect(result.value.analyzedAt.getTime()).toBeGreaterThanOrEqual(startedAt)
    expect(result.value.analyzedAt.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('rejects series with fewer than two data points', () => {
    const series = buildRateSeries([1.08])

    expect(analyzeRateSeries({ series })).toEqual(
      err(
        createDomainError(
          'InsufficientDataForAnalysis',
          'Need at least 2 data points to analyze a rate series',
          'rates',
        ),
      ),
    )
  })
})