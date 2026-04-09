export type ValidationErrorCode =
  | 'MustBePositive'
  | 'MustBeFinite'
  | 'MustBeNumber'
  | 'InvalidCurrency'
  | 'InvalidDateRange'
  | 'FutureDate'

export type DomainErrorCode =
  | 'InvalidCurrencyCode'
  | 'InvalidAmount'
  | 'RateMustBePositive'
  | 'DateOutOfRange'
  | 'UnsupportedCurrencyPair'
  | 'InsufficientDataForAnalysis'
  | 'BaseMustDifferFromQuote'
  | 'StartMustBeBeforeEnd'
  | 'FutureDatesNotAllowed'
  | 'SameCurrencyConversion'
  | 'RateOutOfBounds'

export type InfrastructureErrorCode =
  | 'NetworkFailure'
  | 'Timeout'
  | 'ExternalServiceUnavailable'
  | 'ExternalServiceRateLimited'
  | 'ExternalServiceBadRequest'
  | 'UnexpectedResponseShape'
  | 'UnexpectedError'
  | 'NoDataForPeriod'
  | 'CacheMiss'

export type ValidationError = {
  readonly tag: 'ValidationError'
  readonly code?: ValidationErrorCode
  readonly message: string
  readonly field?: string
}

export type DomainError = {
  readonly tag: 'DomainError'
  readonly code: DomainErrorCode
  readonly message: string
  readonly field?: string
}

export type InfrastructureError = {
  readonly tag: 'InfrastructureError'
  readonly code: InfrastructureErrorCode
  readonly message: string
  readonly cause?: unknown
}

export type AppError = ValidationError | DomainError | InfrastructureError

export function createValidationError(
  code: ValidationErrorCode,
  fieldOrMessage: string,
  message?: string,
): ValidationError {
  if (message === undefined) {
    return {
      tag: 'ValidationError',
      code,
      message: fieldOrMessage,
    }
  }

  return {
    tag: 'ValidationError',
    code,
    field: fieldOrMessage,
    message,
  }
}

export function createDomainError(
  code: DomainErrorCode,
  message: string,
  field?: string,
): DomainError {
  return {
    tag: 'DomainError',
    code,
    message,
    ...(field === undefined ? {} : { field }),
  }
}

export function createInfrastructureError(
  code: InfrastructureErrorCode,
  message: string,
  cause?: unknown,
): InfrastructureError {
  return {
    tag: 'InfrastructureError',
    code,
    message,
    ...(cause === undefined ? {} : { cause }),
  }
}

export function isValidationError(error: AppError): error is ValidationError {
  return error.tag === 'ValidationError'
}

export function isDomainError(error: AppError): error is DomainError {
  return error.tag === 'DomainError'
}

export function isInfrastructureError(
  error: AppError,
): error is InfrastructureError {
  return error.tag === 'InfrastructureError'
}