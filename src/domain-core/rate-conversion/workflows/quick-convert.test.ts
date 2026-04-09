import { describe, expect, it, vi } from 'vitest'

import { err, isErr, ok, type Result } from '@/domain-core/shared-kernel/result'
import {
  createCurrency,
  createCurrencyPair,
  createPositiveNumber,
  unsafeCreateNonNegativeNumber,
  unsafeCreatePositiveNumber,
  type Currency,
  type CurrencyPair,
  type ExchangeRate,
} from '@/domain-core/shared-kernel/types'
import { createDomainError, createInfrastructureError } from '@/domain-core/shared-kernel/errors'
import { quickConvert } from '@/domain-core/rate-conversion/workflows/quick-convert'
import type { FetchRate, QuickConvertCommand } from '@/domain-core/rate-conversion/types'

function unwrapOk<T, E>(result: Result<T, E>): T {
  if (isErr(result)) {
    throw new Error('Expected ok result')
  }

  return result.value
}

function buildCurrency(code: string): Currency {
  return unwrapOk(createCurrency(code))
}

function buildCommand(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
): QuickConvertCommand {
  return {
    amount: unwrapOk(createPositiveNumber(amount)),
    fromCurrency,
    toCurrency,
  }
}

function buildExchangeRate(
  pair: CurrencyPair,
  rate: number,
  timestamp: Date,
): ExchangeRate {
  return {
    pair,
    rate: unsafeCreatePositiveNumber(rate),
    timestamp,
    source: 'Mock',
  }
}

describe('quickConvert', () => {
  it('converts an amount and calculates the inverse rate', async () => {
    const fromCurrency = buildCurrency('EUR')
    const toCurrency = buildCurrency('USD')
    const pair = unwrapOk(createCurrencyPair(fromCurrency, toCurrency))
    const exchangeRate = buildExchangeRate(
      pair,
      1.1,
      new Date('2026-01-01T00:00:00Z'),
    )
    const fetchRate: FetchRate = vi.fn(async (incomingPair) => {
      expect(incomingPair).toEqual(pair)
      return ok(exchangeRate)
    })
    const workflow = quickConvert(fetchRate)
    const command = buildCommand(100, fromCurrency, toCurrency)
    const startedAt = Date.now()

    const result = await workflow(command)

    if (isErr(result)) {
      throw new Error('Expected ok result')
    }

    expect(result.value.from).toEqual({
      amount: unsafeCreateNonNegativeNumber(100),
      currency: fromCurrency,
    })
    expect(result.value.to.currency).toBe(toCurrency)
    expect(result.value.to.amount).toBeCloseTo(110)
    expect(result.value.rate).toBe(exchangeRate)
    expect(result.value.inverseRate).toBeCloseTo(1 / 1.1)
    expect(result.value.calculatedAt.getTime()).toBeGreaterThanOrEqual(startedAt)
    expect(fetchRate).toHaveBeenCalledTimes(1)
  })

  it('rejects same-currency conversion before calling the dependency', async () => {
    const currency = buildCurrency('EUR')
    const fetchRate: FetchRate = vi.fn(async () => {
      throw new Error('fetchRate should not be called for same-currency pairs')
    })
    const workflow = quickConvert(fetchRate)
    const command = buildCommand(100, currency, currency)

    const result = await workflow(command)

    expect(fetchRate).not.toHaveBeenCalled()
    expect(result).toEqual(
      err(
        createDomainError(
          'SameCurrencyConversion',
          'Base and quote currencies must differ',
          'pair',
        ),
      ),
    )
  })

  it('propagates infrastructure failures from the dependency', async () => {
    const fromCurrency = buildCurrency('EUR')
    const toCurrency = buildCurrency('USD')
    const pair = unwrapOk(createCurrencyPair(fromCurrency, toCurrency))
    const infrastructureError = createInfrastructureError(
      'Timeout',
      'Frankfurter timed out',
    )
    const fetchRate: FetchRate = vi.fn(async (incomingPair) => {
      expect(incomingPair).toEqual(pair)
      return err(infrastructureError)
    })
    const workflow = quickConvert(fetchRate)
    const command = buildCommand(50, fromCurrency, toCurrency)

    const result = await workflow(command)

    expect(fetchRate).toHaveBeenCalledTimes(1)
    expect(result).toEqual(err(infrastructureError))
  })
})