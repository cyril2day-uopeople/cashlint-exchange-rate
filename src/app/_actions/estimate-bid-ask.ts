'use server'

import { fold, err, map, mapError, type Result } from '@/domain-core/shared-kernel/result'
import { estimateBidAsk } from '@/domain-core/rate-conversion/workflows/estimate-bid-ask'
import {
  bidAskEstimateToDTO,
  errorToDTO,
  type ErrorDTO,
  type BidAskEstimateDTO,
  type EstimateBidAskRequestDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildEstimateBidAskCommandResult } from '@/app/_actions/utils/commands'

type EstimateBidAskActionResult = Result<BidAskEstimateDTO, ErrorDTO>

async function estimateBidAskActionImpl(
  input: EstimateBidAskRequestDTO,
): Promise<EstimateBidAskActionResult> {
  return fold(
    buildEstimateBidAskCommandResult(input),
    async (error): Promise<EstimateBidAskActionResult> => err(errorToDTO(error)),
    async (command): Promise<EstimateBidAskActionResult> => {
      const result = estimateBidAsk(command)

      return mapError(
        map(result, (value) => bidAskEstimateToDTO(command.exchangeRate, value)),
        errorToDTO,
      )
    },
  )
}

export const estimateBidAskAction = withPanicBoundary(estimateBidAskActionImpl)
export const createEstimateBidAskAction = () => estimateBidAskAction