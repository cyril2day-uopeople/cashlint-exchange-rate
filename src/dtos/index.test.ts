import { describe, expect, it } from 'vitest'

import { createDomainError, createInfrastructureError, createValidationError } from '@/domain-core/shared-kernel/errors'
import { isErr, type Result } from '@/domain-core/shared-kernel/result'
import {
  createCurrency,
  createCurrencyPair,
  createDateRange,
  unsafeCreateNonNegativeNumber,
  unsafeCreatePositiveNumber,
  type Currency,
  type CurrencyPair,
  type ExchangeRate,
} from '@/domain-core/shared-kernel/types'
import {
  bidAskEstimateToDTO,
  errorToDTO,
  historicalRatesResponseToDTO,
  quickConvertResponseToDTO,
  rateAnalysisResponseToDTO,
  type RateAnalysisResponseDTO,
  type RateAnalysisRequestDTO,
} from '@/dtos'
import type { BidAskEstimate, ConversionResult } from '@/domain-core/rate-conversion/types'
import type { RateAnalysis, RateSeries } from '@/domain-core/rate-analysis/types'

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
  return unwrapOk(createCurrencyPair(buildCurrency('EUR'), buildCurrency('USD')))
}

function buildExchangeRate(rate: number, timestamp: string): ExchangeRate {
  return {
    pair: buildPair(),
    rate: unsafeCreatePositiveNumber(rate),
    timestamp: new Date(timestamp),
    source: 'Frankfurter',
  }
}

function buildRateSeries(): RateSeries {
  const pair = buildPair()
  const rates = [
    buildExchangeRate(1.08, '2026-04-01T00:00:00Z'),
    buildExchangeRate(1.05, '2026-04-02T00:00:00Z'),
  ] as const

  return {
    pair,
    rates,
    dateRange: unwrapOk(
      createDateRange(
        new Date('2026-04-01T00:00:00Z'),
        new Date('2026-04-02T00:00:00Z'),
      ),
    ),
    source: 'Frankfurter',
  }
}

function buildConversionResult(): ConversionResult {
  const pair = buildPair()
  const rate = buildExchangeRate(1.08, '2026-04-01T12:00:00Z')

  return {
    from: {
      amount: unsafeCreateNonNegativeNumber(100),
      currency: pair.base,
    },
    to: {
      amount: unsafeCreateNonNegativeNumber(108),
      currency: pair.quote,
    },
    rate,
    inverseRate: unsafeCreatePositiveNumber(1 / 1.08),
    calculatedAt: new Date('2026-04-01T12:30:00Z'),
  }
}

function buildBidAskEstimate(): BidAskEstimate {
  return {
    midRate: unsafeCreatePositiveNumber(1.08),
    bidRate: unsafeCreatePositiveNumber(1.07),
    askRate: unsafeCreatePositiveNumber(1.09),
    spread: unsafeCreatePositiveNumber(0.02),
    spreadPercent: 0.02,
    spreadType: 'Bank',
  }
}

function buildRateAnalysis(): RateAnalysis {
  const series = buildRateSeries()

  return {
    series,
    statistics: {
      current: unsafeCreatePositiveNumber(1.05),
      average: unsafeCreatePositiveNumber(1.065),
      minimum: unsafeCreatePositiveNumber(1.05),
      maximum: unsafeCreatePositiveNumber(1.08),
      range: unsafeCreateNonNegativeNumber(0.03),
      dataPoints: 2,
    },
    trend: {
      direction: 'Weakening',
      percentChange: -1.41,
      comparedTo: 'VsAverage',
    },
    volatility: {
      value: unsafeCreateNonNegativeNumber(2.82),
      level: 'Medium',
      interpretation: 'Moderate fluctuation. Consider timing carefully.',
    },
    analyzedAt: new Date('2026-04-01T13:00:00Z'),
  }
}

describe('errorToDTO', () => {
  it('preserves validation error details', () => {
    expect(errorToDTO(createValidationError('MustBePositive', 'amount', 'Value must be greater than zero'))).toEqual(
      {
        error: {
          tag: 'ValidationError',
          code: 'MustBePositive',
          field: 'amount',
          message: 'Value must be greater than zero',
        },
      },
    )
  })

  it('preserves infrastructure error details', () => {
    expect(errorToDTO(createInfrastructureError('Timeout', 'Request timed out'))).toEqual(
      {
        error: {
          tag: 'InfrastructureError',
          code: 'Timeout',
          message: 'Request timed out',
        },
      },
    )
  })

  it('preserves domain error details', () => {
    expect(errorToDTO(createDomainError('SameCurrencyConversion', 'Base and quote currencies must differ', 'pair'))).toEqual(
      {
        error: {
          tag: 'DomainError',
          code: 'SameCurrencyConversion',
          field: 'pair',
          message: 'Base and quote currencies must differ',
        },
      },
    )
  })
})

describe('quickConvertResponseToDTO', () => {
  it('serializes the conversion result', () => {
    expect(quickConvertResponseToDTO(buildConversionResult())).toEqual({
      from: { amount: 100, currency: 'EUR' },
      to: { amount: 108, currency: 'USD' },
      rate: {
        base: 'EUR',
        quote: 'USD',
        rate: 1.08,
        date: '2026-04-01T12:00:00.000Z',
        source: 'Frankfurter',
      },
      inverseRate: unsafeCreatePositiveNumber(1 / 1.08),
      calculatedAt: '2026-04-01T12:30:00.000Z',
    })
  })
})

describe('historicalRatesResponseToDTO', () => {
  it('serializes a rate series with date-only points', () => {
    expect(historicalRatesResponseToDTO(buildRateSeries())).toEqual({
      base: 'EUR',
      quote: 'USD',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      rates: [
        { date: '2026-04-01', rate: 1.08 },
        { date: '2026-04-02', rate: 1.05 },
      ],
      source: 'Frankfurter',
    })
  })
})

describe('rateAnalysisResponseToDTO', () => {
  it('serializes the analysis result and maps trend labels', () => {
    const response: RateAnalysisResponseDTO = rateAnalysisResponseToDTO(buildRateAnalysis())

    expect(response.series.base).toBe('EUR')
    expect(response.statistics.average).toBeCloseTo(1.065)
    expect(response.trend.direction).toBe('weakening')
    expect(response.trend.comparedTo).toBe('average')
    expect(response.volatility.level).toBe('Medium')
    expect(response.analyzedAt).toBe('2026-04-01T13:00:00.000Z')
  })
})