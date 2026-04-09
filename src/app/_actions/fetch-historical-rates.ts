'use server'

import { fold, err, map, mapError, type Result } from '@/domain-core/shared-kernel/result'
import { fetchHistoricalRates } from '@/domain-core/rate-analysis/workflows/fetch-historical-rates'
import { fetchRateSeriesFromFrankfurter } from '@/infrastructure/frankfurter'
import {
  errorToDTO,
  historicalRatesResponseToDTO,
  type ErrorDTO,
  type HistoricalRatesRequestDTO,
  type HistoricalRatesResponseDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildHistoricalRatesCommandResult } from '@/app/_actions/utils/commands'

type FetchHistoricalRatesActionResult = Result<HistoricalRatesResponseDTO, ErrorDTO>

async function fetchHistoricalRatesActionImpl(
  input: HistoricalRatesRequestDTO,
): Promise<FetchHistoricalRatesActionResult> {
  return fold(
    buildHistoricalRatesCommandResult(input),
    async (error): Promise<FetchHistoricalRatesActionResult> => err(errorToDTO(error)),
    async (command): Promise<FetchHistoricalRatesActionResult> => {
      const workflow = fetchHistoricalRates(fetchRateSeriesFromFrankfurter)
      const result = await workflow(command)

      return mapError(
        map(result, historicalRatesResponseToDTO),
        errorToDTO,
      )
    },
  )
}

export const fetchHistoricalRatesAction = withPanicBoundary(
  fetchHistoricalRatesActionImpl,
)
export const createFetchHistoricalRatesAction = () => fetchHistoricalRatesAction