'use server'

import { bind } from '@/domain-core/shared-kernel/result'
import { analyzeRateSeries } from '@/domain-core/rate-analysis/workflows/analyze-rate-series'
import { fetchHistoricalRates } from '@/domain-core/rate-analysis/workflows/fetch-historical-rates'
import { fetchRateSeriesFromFrankfurter } from '@/infrastructure/frankfurter'
import {
  rateAnalysisResponseToDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildRateAnalysisCommandResult } from '@/app/_actions/utils/commands'
import { createWorkflowAction } from '@/app/_actions/utils/workflow-action'

const fetchHistoricalRatesWorkflow = fetchHistoricalRates(
  fetchRateSeriesFromFrankfurter,
)

export const analyzeRateSeriesAction = withPanicBoundary(
  createWorkflowAction(
    buildRateAnalysisCommandResult,
    async (command) => {
      const seriesResult = await fetchHistoricalRatesWorkflow(command)

      return bind(seriesResult, (series) => analyzeRateSeries({ series }))
    },
    (_command, value) => rateAnalysisResponseToDTO(value),
  ),
)