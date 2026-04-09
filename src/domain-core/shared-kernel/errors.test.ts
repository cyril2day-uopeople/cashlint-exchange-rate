import { describe, expect, it } from 'vitest'

import {
  createDomainError,
  createInfrastructureError,
  createValidationError,
  isDomainError,
  isInfrastructureError,
  isValidationError,
  type AppError,
} from '@/domain-core/shared-kernel/errors'

describe('validationError', () => {
  it('creates a tagged validation error with a message only', () => {
    expect(createValidationError('MustBeNumber', 'Value must be a number')).toEqual({
      tag: 'ValidationError',
      code: 'MustBeNumber',
      message: 'Value must be a number',
    })
  })

  it('creates a tagged validation error with a field', () => {
    expect(
      createValidationError(
        'InvalidCurrency',
        'code',
        'Currency code must be valid',
      ),
    ).toEqual({
      tag: 'ValidationError',
      code: 'InvalidCurrency',
      field: 'code',
      message: 'Currency code must be valid',
    })
  })
})

describe('domainError', () => {
  it('creates a tagged domain error', () => {
    expect(
      createDomainError('SameCurrencyConversion', 'Base and quote currencies differ', 'pair'),
    ).toEqual({
      tag: 'DomainError',
      code: 'SameCurrencyConversion',
      field: 'pair',
      message: 'Base and quote currencies differ',
    })
  })
})

describe('infrastructureError', () => {
  it('creates a tagged infrastructure error', () => {
    const cause = new Error('socket closed')

    expect(
      createInfrastructureError('NetworkFailure', 'Failed to reach the API', cause),
    ).toEqual({
      tag: 'InfrastructureError',
      code: 'NetworkFailure',
      cause,
      message: 'Failed to reach the API',
    })
  })
})

describe('error narrowing', () => {
  it('narrows AppError by tag', () => {
    const error: AppError = createValidationError(
      'MustBePositive',
      'Value must be greater than zero',
    )

    expect(isValidationError(error)).toBe(true)
    expect(isDomainError(error)).toBe(false)
    expect(isInfrastructureError(error)).toBe(false)
  })

  it('narrows domain errors by tag', () => {
    const error: AppError = createDomainError(
      'SameCurrencyConversion',
      'Base and quote currencies must differ',
    )

    expect(isValidationError(error)).toBe(false)
    expect(isDomainError(error)).toBe(true)
    expect(isInfrastructureError(error)).toBe(false)
  })
})