'use server'

import { fold, err, map, mapError, type Result } from '@/domain-core/shared-kernel/result'
import { analyzeRateSeries } from '@/domain-core/rate-analysis/workflows/analyze-rate-series'
import { fetchHistoricalRates } from '@/domain-core/rate-analysis/workflows/fetch-historical-rates'
import { fetchRateSeriesFromFrankfurter } from '@/infrastructure/frankfurter'
import {
  errorToDTO,
  rateAnalysisResponseToDTO,
  type ErrorDTO,
  type RateAnalysisRequestDTO,
  type RateAnalysisResponseDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildRateAnalysisCommandResult } from '@/app/_actions/utils/commands'

type RateAnalysisActionResult = Result<RateAnalysisResponseDTO, ErrorDTO>

async function analyzeRateSeriesActionImpl(
  input: RateAnalysisRequestDTO,
): Promise<RateAnalysisActionResult> {
  return fold(
    buildRateAnalysisCommandResult(input),
    async (error): Promise<RateAnalysisActionResult> => err(errorToDTO(error)),
    async (command): Promise<RateAnalysisActionResult> => {
      const seriesResult = await fetchHistoricalRates(fetchRateSeriesFromFrankfurter)(command)

      return fold(
        seriesResult,
        async (error): Promise<RateAnalysisActionResult> => err(errorToDTO(error)),
        async (series): Promise<RateAnalysisActionResult> =>
          mapError(
            map(analyzeRateSeries({ series }), rateAnalysisResponseToDTO),
            errorToDTO,
          ),
      )
    },
  )
}

export const analyzeRateSeriesAction = withPanicBoundary(
  analyzeRateSeriesActionImpl,
)
export const createAnalyzeRateSeriesAction = () => analyzeRateSeriesAction