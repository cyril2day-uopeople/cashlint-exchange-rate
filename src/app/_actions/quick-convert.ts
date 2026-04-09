'use server'

import { fold, err, map, mapError, type Result } from '@/domain-core/shared-kernel/result'
import { quickConvert } from '@/domain-core/rate-conversion/workflows/quick-convert'
import { fetchRateFromFrankfurter } from '@/infrastructure/frankfurter'
import {
  errorToDTO,
  quickConvertResponseToDTO,
  type ErrorDTO,
  type QuickConvertRequestDTO,
  type QuickConvertResponseDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildQuickConvertCommandResult } from '@/app/_actions/utils/commands'

type QuickConvertActionResult = Result<QuickConvertResponseDTO, ErrorDTO>

async function quickConvertActionImpl(
  input: QuickConvertRequestDTO,
): Promise<QuickConvertActionResult> {
  return fold(
    buildQuickConvertCommandResult(input),
    async (error): Promise<QuickConvertActionResult> => err(errorToDTO(error)),
    async (command): Promise<QuickConvertActionResult> => {
      const workflow = quickConvert(fetchRateFromFrankfurter)
      const result = await workflow(command)

      return mapError(
        map(result, quickConvertResponseToDTO),
        errorToDTO,
      )
    },
  )
}

export const quickConvertAction = withPanicBoundary(quickConvertActionImpl)
export const createQuickConvertAction = () => quickConvertAction