import type { Result } from '@/domain-core/shared-kernel/result'
import type { InfrastructureError } from '@/domain-core/shared-kernel/errors'
import type {
  CurrencyPair,
  DateRange,
  ExchangeRate,
  NonNegativeNumber,
  PositiveNumber,
} from '@/domain-core/shared-kernel/types'

export type TrendDirection = 'Strengthening' | 'Weakening' | 'Stable'

export type TrendComparison = 'VsAverage' | 'VsStart'

export type VolatilityLevel = 'Low' | 'Medium' | 'High'

export type HistoricalPeriod =
  | { readonly kind: 'Last7Days' }
  | { readonly kind: 'Last30Days' }
  | { readonly kind: 'Last90Days' }
  | { readonly kind: 'Last1Year' }
  | { readonly kind: 'Custom'; readonly dateRange: DateRange }

export type RateSeries = {
  readonly pair: CurrencyPair
  readonly rates: readonly [ExchangeRate, ...ExchangeRate[]]
  readonly dateRange: DateRange
  readonly source: string
}

export type RateStatistics = {
  readonly current: PositiveNumber
  readonly average: PositiveNumber
  readonly minimum: PositiveNumber
  readonly maximum: PositiveNumber
  readonly range: NonNegativeNumber
  readonly dataPoints: number
}

export type TrendIndicator = {
  readonly direction: TrendDirection
  readonly percentChange: number
  readonly comparedTo: TrendComparison
}

export type VolatilityMetric = {
  readonly value: NonNegativeNumber
  readonly level: VolatilityLevel
  readonly interpretation: string
}

export type RateAnalysis = {
  readonly series: RateSeries
  readonly statistics: RateStatistics
  readonly trend: TrendIndicator
  readonly volatility: VolatilityMetric
  readonly analyzedAt: Date
}

export type AnalyzeRateSeriesCommand = {
  readonly series: RateSeries
}

export type FetchHistoricalRatesCommand = {
  readonly pair: CurrencyPair
  readonly dateRange: DateRange
}

export type FetchRateSeries = (
  pair: CurrencyPair,
  dateRange: DateRange,
) => Promise<Result<RateSeries, InfrastructureError>>