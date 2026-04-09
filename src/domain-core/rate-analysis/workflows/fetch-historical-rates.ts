import { type Result } from '@/domain-core/shared-kernel/result'
import type { InfrastructureError } from '@/domain-core/shared-kernel/errors'
import type {
  FetchHistoricalRatesCommand,
  FetchRateSeries,
  RateSeries,
} from '@/domain-core/rate-analysis/types'

export function fetchHistoricalRates(fetchRateSeries: FetchRateSeries) {
  return (
    command: FetchHistoricalRatesCommand,
  ): Promise<Result<RateSeries, InfrastructureError>> => {
    return fetchRateSeries(command.pair, command.dateRange)
  }
}