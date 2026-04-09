import type { Result } from '@/domain-core/shared-kernel/result'
import type { InfrastructureError } from '@/domain-core/shared-kernel/errors'
import type {
  Currency,
  CurrencyPair,
  ExchangeRate,
  Money,
  PositiveNumber,
} from '@/domain-core/shared-kernel/types'

export type QuickConvertCommand = {
  readonly amount: PositiveNumber
  readonly fromCurrency: Currency
  readonly toCurrency: Currency
}

export type ConversionResult = {
  readonly from: Money
  readonly to: Money
  readonly rate: ExchangeRate
  readonly inverseRate: PositiveNumber
  readonly calculatedAt: Date
}

export type FetchRate = (
  pair: CurrencyPair,
) => Promise<Result<ExchangeRate, InfrastructureError>>