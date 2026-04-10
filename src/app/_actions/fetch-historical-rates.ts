'use server'

import { fetchHistoricalRates } from '@/domain-core/rate-analysis/workflows/fetch-historical-rates'
import { fetchRateSeriesFromFrankfurter } from '@/infrastructure/frankfurter'
import {
  historicalRatesResponseToDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildHistoricalRatesCommandResult } from '@/app/_actions/utils/commands'
import { createWorkflowAction } from '@/app/_actions/utils/workflow-action'

const fetchHistoricalRatesWorkflow = fetchHistoricalRates(
  fetchRateSeriesFromFrankfurter,
)

export const fetchHistoricalRatesAction = withPanicBoundary(
  createWorkflowAction(
    buildHistoricalRatesCommandResult,
    fetchHistoricalRatesWorkflow,
    (_command, value) => historicalRatesResponseToDTO(value),
  ),
)