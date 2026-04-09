import type { AppError } from '@/domain-core/shared-kernel/errors'
import type {
  BidAskEstimate,
  SpreadType,
  ConversionResult,
} from '@/domain-core/rate-conversion/types'
import type {
  RateAnalysis,
  RateSeries,
  RateStatistics,
  TrendComparison,
  TrendDirection,
  TrendIndicator,
  VolatilityLevel,
  VolatilityMetric,
} from '@/domain-core/rate-analysis/types'
import type {
  CurrencyPair,
  ExchangeRate,
  Money,
  PositiveNumber,
} from '@/domain-core/shared-kernel/types'

export type ErrorDTO = {
  readonly error: {
    readonly tag: AppError['tag']
    readonly code: string
    readonly message: string
    readonly field?: string
  }
}

export type CurrencyPairDTO = {
  readonly base: string
  readonly quote: string
}

export type MoneyDTO = {
  readonly amount: number
  readonly currency: string
}

export type ExchangeRateDTO = {
  readonly base: string
  readonly quote: string
  readonly rate: number
  readonly date: string
  readonly source: string
}

export type QuickConvertRequestDTO = {
  readonly amount: number
  readonly from: string
  readonly to: string
}

export type QuickConvertResponseDTO = {
  readonly from: MoneyDTO
  readonly to: MoneyDTO
  readonly rate: ExchangeRateDTO
  readonly inverseRate: number
  readonly calculatedAt: string
}

export type EstimateBidAskRequestDTO = {
  readonly rate: ExchangeRateDTO
  readonly spreadType: SpreadType
}

export type BidAskEstimateDTO = {
  readonly base: string
  readonly quote: string
  readonly midRate: number
  readonly bidRate: number
  readonly askRate: number
  readonly spread: number
  readonly spreadPercent: number
  readonly spreadType: SpreadType
  readonly timestamp: string
  readonly source: string
}

export type HistoricalRatesRequestDTO = {
  readonly base: string
  readonly quote: string
  readonly startDate: string
  readonly endDate: string
}

export type RateAnalysisRequestDTO = HistoricalRatesRequestDTO

export type RatePointDTO = {
  readonly date: string
  readonly rate: number
}

export type HistoricalRatesResponseDTO = {
  readonly base: string
  readonly quote: string
  readonly startDate: string
  readonly endDate: string
  readonly rates: RatePointDTO[]
  readonly source: string
}

export type TrendDirectionDTO = 'strengthening' | 'weakening' | 'stable'

export type TrendComparisonDTO = 'average' | 'start'

export type RateStatisticsDTO = {
  readonly current: number
  readonly average: number
  readonly minimum: number
  readonly maximum: number
  readonly range: number
  readonly dataPoints: number
}

export type TrendIndicatorDTO = {
  readonly direction: TrendDirectionDTO
  readonly percentChange: number
  readonly comparedTo: TrendComparisonDTO
}

export type VolatilityMetricDTO = {
  readonly value: number
  readonly level: VolatilityLevel
  readonly interpretation: string
}

export type RateAnalysisResponseDTO = {
  readonly series: HistoricalRatesResponseDTO
  readonly statistics: RateStatisticsDTO
  readonly trend: TrendIndicatorDTO
  readonly volatility: VolatilityMetricDTO
  readonly analyzedAt: string
}

function toDateTimeISO(date: Date): string {
  return date.toISOString()
}

function toDateOnlyISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const TREND_DIRECTION_TO_DTO: Record<TrendDirection, TrendDirectionDTO> = {
  Strengthening: 'strengthening',
  Weakening: 'weakening',
  Stable: 'stable',
}

const TREND_COMPARISON_TO_DTO: Record<TrendComparison, TrendComparisonDTO> = {
  VsAverage: 'average',
  VsStart: 'start',
}

export function errorToDTO(error: AppError): ErrorDTO {
  const field = 'field' in error ? error.field : undefined

  return {
    error: {
      tag: error.tag,
      code: error.code ?? 'UnknownError',
      message: error.message,
      ...(field === undefined ? {} : { field }),
    },
  }
}

export function currencyPairToDTO(
  pair: CurrencyPair,
): CurrencyPairDTO {
  return {
    base: pair.base.code,
    quote: pair.quote.code,
  }
}

export function moneyToDTO(money: Money): MoneyDTO {
  return {
    amount: money.amount,
    currency: money.currency.code,
  }
}

export function exchangeRateToDTO(
  exchangeRate: ExchangeRate,
): ExchangeRateDTO {
  return {
    base: exchangeRate.pair.base.code,
    quote: exchangeRate.pair.quote.code,
    rate: exchangeRate.rate,
    date: toDateTimeISO(exchangeRate.timestamp),
    source: exchangeRate.source,
  }
}

export function quickConvertResponseToDTO(
  result: ConversionResult,
): QuickConvertResponseDTO {
  return {
    from: moneyToDTO(result.from),
    to: moneyToDTO(result.to),
    rate: exchangeRateToDTO(result.rate),
    inverseRate: result.inverseRate,
    calculatedAt: toDateTimeISO(result.calculatedAt),
  }
}

export function bidAskEstimateToDTO(
  exchangeRate: ExchangeRate,
  estimate: BidAskEstimate,
): BidAskEstimateDTO {
  return {
    base: exchangeRate.pair.base.code,
    quote: exchangeRate.pair.quote.code,
    midRate: estimate.midRate,
    bidRate: estimate.bidRate,
    askRate: estimate.askRate,
    spread: estimate.spread,
    spreadPercent: estimate.spreadPercent,
    spreadType: estimate.spreadType,
    timestamp: toDateTimeISO(exchangeRate.timestamp),
    source: exchangeRate.source,
  }
}

export function ratePointToDTO(exchangeRate: ExchangeRate): RatePointDTO {
  return {
    date: toDateOnlyISO(exchangeRate.timestamp),
    rate: exchangeRate.rate,
  }
}

export function historicalRatesResponseToDTO(
  series: RateSeries,
): HistoricalRatesResponseDTO {
  return {
    base: series.pair.base.code,
    quote: series.pair.quote.code,
    startDate: toDateOnlyISO(series.dateRange.start),
    endDate: toDateOnlyISO(series.dateRange.end),
    rates: series.rates.map(ratePointToDTO),
    source: series.source,
  }
}

export function rateStatisticsToDTO(
  statistics: RateStatistics,
): RateStatisticsDTO {
  return {
    current: statistics.current,
    average: statistics.average,
    minimum: statistics.minimum,
    maximum: statistics.maximum,
    range: statistics.range,
    dataPoints: statistics.dataPoints,
  }
}

export function trendIndicatorToDTO(
  trend: TrendIndicator,
): TrendIndicatorDTO {
  return {
    direction: TREND_DIRECTION_TO_DTO[trend.direction],
    percentChange: trend.percentChange,
    comparedTo: TREND_COMPARISON_TO_DTO[trend.comparedTo],
  }
}

export function volatilityMetricToDTO(
  volatility: VolatilityMetric,
): VolatilityMetricDTO {
  return {
    value: volatility.value,
    level: volatility.level,
    interpretation: volatility.interpretation,
  }
}

export function rateAnalysisResponseToDTO(
  analysis: RateAnalysis,
): RateAnalysisResponseDTO {
  return {
    series: historicalRatesResponseToDTO(analysis.series),
    statistics: rateStatisticsToDTO(analysis.statistics),
    trend: trendIndicatorToDTO(analysis.trend),
    volatility: volatilityMetricToDTO(analysis.volatility),
    analyzedAt: toDateTimeISO(analysis.analyzedAt),
  }
}

export type { SpreadType, PositiveNumber }