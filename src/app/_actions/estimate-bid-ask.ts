'use server'

import { estimateBidAsk } from '@/domain-core/rate-conversion/workflows/estimate-bid-ask'
import {
  bidAskEstimateToDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildEstimateBidAskCommandResult } from '@/app/_actions/utils/commands'
import { createWorkflowAction } from '@/app/_actions/utils/workflow-action'

export const estimateBidAskAction = withPanicBoundary(
  createWorkflowAction(
    buildEstimateBidAskCommandResult,
    estimateBidAsk,
    (command, value) => bidAskEstimateToDTO(command.exchangeRate, value),
  ),
)