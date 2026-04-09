import { always, both, cond, compose, gt, gte, lt, lte, mean, T } from 'ramda'

import { err, map, ok, type Result } from '@/domain-core/shared-kernel/result'
import { createDomainError, type AppError } from '@/domain-core/shared-kernel/errors'
import {
  unsafeCreateNonNegativeNumber,
  unsafeCreatePositiveNumber,
  type ExchangeRate,
  type NonNegativeNumber,
  type PositiveNumber,
} from '@/domain-core/shared-kernel/types'
import type {
  AnalyzeRateSeriesCommand,
  RateAnalysis,
  RateSeries,
  RateStatistics,
  TrendDirection,
  TrendIndicator,
  VolatilityLevel,
  VolatilityMetric,
} from '@/domain-core/rate-analysis/types'

const STABLE_TREND_THRESHOLD = 0.5
const LOW_VOLATILITY_THRESHOLD = 2
const MEDIUM_VOLATILITY_THRESHOLD = 5

const VOLATILITY_INTERPRETATIONS: Record<VolatilityLevel, string> = {
  Low: 'Rate is stable. Good conditions for conversion.',
  Medium: 'Moderate fluctuation. Consider timing carefully.',
  High: 'High volatility. Rate could swing significantly.',
}

const isStrengtheningTrend = lt(STABLE_TREND_THRESHOLD)
const isWeakeningTrend = gt(-STABLE_TREND_THRESHOLD)

const isLowVolatility = gt(LOW_VOLATILITY_THRESHOLD)
const isMediumVolatility = both(
  gte(MEDIUM_VOLATILITY_THRESHOLD),
  lte(LOW_VOLATILITY_THRESHOLD),
)

function extractRates(series: RateSeries): PositiveNumber[] {
  return series.rates.map((exchangeRate: ExchangeRate) => exchangeRate.rate)
}

function getCurrentRate(rates: readonly PositiveNumber[]): PositiveNumber {
  return rates[rates.length - 1]
}

const getAverageRate = compose(unsafeCreatePositiveNumber, mean)

function getMinimumRate(rates: readonly PositiveNumber[]): PositiveNumber {
  return unsafeCreatePositiveNumber(Math.min(...rates))
}

function getMaximumRate(rates: readonly PositiveNumber[]): PositiveNumber {
  return unsafeCreatePositiveNumber(Math.max(...rates))
}

function calculateRateRange(
  minimumRate: PositiveNumber,
  maximumRate: PositiveNumber,
): NonNegativeNumber {
  return unsafeCreateNonNegativeNumber(maximumRate - minimumRate)
}

function buildRateStatistics(rates: readonly PositiveNumber[]): RateStatistics {
  const current = getCurrentRate(rates)
  const average = getAverageRate(rates)
  const minimum = getMinimumRate(rates)
  const maximum = getMaximumRate(rates)

  return {
    current,
    average,
    minimum,
    maximum,
    range: calculateRateRange(minimum, maximum),
    dataPoints: rates.length,
  }
}

function calculatePercentChange(
  currentRate: PositiveNumber,
  averageRate: PositiveNumber,
): number {
  return ((currentRate - averageRate) / averageRate) * 100
}

const classifyTrendDirection = cond<[number], TrendDirection>([
  [isStrengtheningTrend, always('Strengthening')],
  [isWeakeningTrend, always('Weakening')],
  [T, always('Stable')],
])

function buildTrendIndicator(
  currentRate: PositiveNumber,
  averageRate: PositiveNumber,
): TrendIndicator {
  const percentChange = calculatePercentChange(currentRate, averageRate)

  return {
    direction: classifyTrendDirection(percentChange),
    percentChange,
    comparedTo: 'VsAverage',
  }
}

const classifyVolatilityLevel = cond<[number], VolatilityLevel>([
  [isLowVolatility, always('Low')],
  [isMediumVolatility, always('Medium')],
  [T, always('High')],
])

function buildVolatilityMetric(
  statistics: RateStatistics,
): VolatilityMetric {
  const volatilityPercent = (statistics.range / statistics.average) * 100
  const level = classifyVolatilityLevel(volatilityPercent)

  return {
    value: unsafeCreateNonNegativeNumber(volatilityPercent),
    level,
    interpretation: VOLATILITY_INTERPRETATIONS[level],
  }
}

function buildRateAnalysis(
  series: RateSeries,
): RateAnalysis {
  const rates = extractRates(series)
  const statistics = buildRateStatistics(rates)

  return {
    series,
    statistics,
    trend: buildTrendIndicator(statistics.current, statistics.average),
    volatility: buildVolatilityMetric(statistics),
    analyzedAt: new Date(),
  }
}

function ensureMinimumDataPoints(
  series: RateSeries,
): Result<RateSeries, AppError> {
  if (series.rates.length < 2) {
    return err(
      createDomainError(
        'InsufficientDataForAnalysis',
        'Need at least 2 data points to analyze a rate series',
        'rates',
      ),
    )
  }

  return ok(series)
}

export function analyzeRateSeries(
  command: AnalyzeRateSeriesCommand,
): Result<RateAnalysis, AppError> {
  return map(ensureMinimumDataPoints(command.series), buildRateAnalysis)
}