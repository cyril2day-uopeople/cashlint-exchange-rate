'use server'

import { createInfrastructureError } from '@/domain-core/shared-kernel/errors'
import { err, type Result } from '@/domain-core/shared-kernel/result'
import { errorToDTO, type ErrorDTO } from '@/dtos'

export function withPanicBoundary<I, O>(
  action: (input: I) => Promise<Result<O, ErrorDTO>>,
): (input: I) => Promise<Result<O, ErrorDTO>> {
  return async (input) => {
    try {
      return await action(input)
    } catch (cause) {
      return err(
        errorToDTO(
          createInfrastructureError(
            'UnexpectedError',
            'An unexpected error occurred',
            cause,
          ),
        ),
      )
    }
  }
}