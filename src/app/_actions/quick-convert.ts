'use server'

import { quickConvert } from '@/domain-core/rate-conversion/workflows/quick-convert'
import { fetchRateFromFrankfurter } from '@/infrastructure/frankfurter'
import {
  quickConvertResponseToDTO,
} from '@/dtos'
import { withPanicBoundary } from '@/app/_actions/utils/panic-boundary'
import { buildQuickConvertCommandResult } from '@/app/_actions/utils/commands'
import { createWorkflowAction } from '@/app/_actions/utils/workflow-action'

const quickConvertWorkflow = quickConvert(fetchRateFromFrankfurter)

export const quickConvertAction = withPanicBoundary(
  createWorkflowAction(
    buildQuickConvertCommandResult,
    quickConvertWorkflow,
    (_command, value) => quickConvertResponseToDTO(value),
  ),
)