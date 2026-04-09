import { describe, expect, it } from 'vitest'

import { isErr, type Result } from '@/domain-core/shared-kernel/result'
import {
  createCurrency,
  createCurrencyPair,
  unsafeCreatePositiveNumber,
  type Currency,
  type ExchangeRate,
} from '@/domain-core/shared-kernel/types'
import { estimateBidAsk } from '@/domain-core/rate-conversion/workflows/estimate-bid-ask'
import type {
  BidAskEstimate,
  EstimateBidAskCommand,
  SpreadType,
} from '@/domain-core/rate-conversion/types'

function unwrapOk<T, E>(result: Result<T, E>): T {
  if (isErr(result)) {
    throw new Error('Expected ok result')
  }

  return result.value
}

function buildCurrency(code: string): Currency {
  return unwrapOk(createCurrency(code))
}

function buildExchangeRate(rate: number): ExchangeRate {
  const fromCurrency = buildCurrency('EUR')
  const toCurrency = buildCurrency('USD')

  return {
    pair: unwrapOk(createCurrencyPair(fromCurrency, toCurrency)),
    rate: unsafeCreatePositiveNumber(rate),
    timestamp: new Date('2026-01-01T00:00:00Z'),
    source: 'Mock',
  }
}

function buildCommand(
  rate: number,
  spreadType: SpreadType,
): EstimateBidAskCommand {
  return {
    exchangeRate: buildExchangeRate(rate),
    spreadType,
  }
}

function expectEstimate(result: BidAskEstimate) {
  expect(result.askRate).toBeGreaterThan(result.midRate)
  expect(result.bidRate).toBeLessThan(result.midRate)
  expect(result.askRate).toBeGreaterThan(result.bidRate)
  expect(result.spread).toBeCloseTo(result.askRate - result.bidRate)
}

describe('estimateBidAsk', () => {
  it('calculates bank spread rates from a mid-market rate', () => {
    const result = estimateBidAsk(buildCommand(1, 'Bank'))

    expect(isErr(result)).toBe(false)

    if (isErr(result)) {
      throw new Error('Expected ok result')
    }

    expect(result.value.midRate).toBe(unsafeCreatePositiveNumber(1))
    expect(result.value.bidRate).toBeCloseTo(0.99)
    expect(result.value.askRate).toBeCloseTo(1.01)
    expect(result.value.spread).toBeCloseTo(0.02)
    expect(result.value.spreadPercent).toBe(0.02)
    expect(result.value.spreadType).toBe('Bank')
    expectEstimate(result.value)
  })

  it('calculates online spread rates at scale', () => {
    const result = estimateBidAsk(buildCommand(100, 'Online'))

    if (isErr(result)) {
      throw new Error('Expected ok result')
    }

    expect(result.value.midRate).toBe(unsafeCreatePositiveNumber(100))
    expect(result.value.bidRate).toBeCloseTo(99.75)
    expect(result.value.askRate).toBeCloseTo(100.25)
    expect(result.value.spread).toBeCloseTo(0.5)
    expect(result.value.spreadPercent).toBe(0.005)
    expect(result.value.spreadType).toBe('Online')
    expectEstimate(result.value)
  })

  it('calculates airport spread rates for a larger mid-market rate', () => {
    const result = estimateBidAsk(buildCommand(150, 'Airport'))

    if (isErr(result)) {
      throw new Error('Expected ok result')
    }

    expect(result.value.bidRate).toBeCloseTo(146.25)
    expect(result.value.askRate).toBeCloseTo(153.75)
    expect(result.value.spread).toBeCloseTo(7.5)
    expect(result.value.spreadPercent).toBe(0.05)
    expect(result.value.spreadType).toBe('Airport')
    expectEstimate(result.value)
  })
})