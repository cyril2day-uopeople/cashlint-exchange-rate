import { pipe } from 'ramda'

import type { AppError } from '@/domain-core/shared-kernel/errors'
import { err, fold, map, mapError, type Result } from '@/domain-core/shared-kernel/result'
import { errorToDTO, type ErrorDTO } from '@/dtos'

type MaybePromise<T> = T | Promise<T>

function createActionResultSerializer<TCommand, TOutput, TDTO>(
  command: TCommand,
  serialize: (command: TCommand, value: TOutput) => TDTO,
): (result: Result<TOutput, AppError>) => Result<TDTO, ErrorDTO> {
  return pipe(
    (result: Result<TOutput, AppError>) =>
      map(result, (value) => serialize(command, value)),
    (result: Result<TDTO, AppError>) => mapError(result, errorToDTO),
  )
}

export function createWorkflowAction<TInput, TCommand, TOutput, TDTO>(
  buildCommand: (input: TInput) => Result<TCommand, AppError>,
  execute: (command: TCommand) => MaybePromise<Result<TOutput, AppError>>,
  serialize: (command: TCommand, value: TOutput) => TDTO,
): (input: TInput) => Promise<Result<TDTO, ErrorDTO>> {
  return async (input) =>
    fold(
      buildCommand(input),
      async (error): Promise<Result<TDTO, ErrorDTO>> => err(errorToDTO(error)),
      async (command): Promise<Result<TDTO, ErrorDTO>> => {
        const result = await execute(command)

        return createActionResultSerializer(command, serialize)(result)
      },
    )
}