import { describe, expect, it, vi, beforeEach } from 'vitest'

import { err, ok } from '@/domain-core/shared-kernel/result'
import { createInfrastructureError } from '@/domain-core/shared-kernel/errors'
import {
  createCurrency,
  createCurrencyPair,
  createDateRange,
  type Currency,
  type CurrencyPair,
} from '@/domain-core/shared-kernel/types'
import {
  fetchHistorical,
  fetchRate,
} from '@/infrastructure/frankfurter/client'
import {
  fetchRateFromFrankfurter,
  fetchRateSeriesFromFrankfurter,
} from '@/infrastructure/frankfurter/acl'

vi.mock('server-only', () => ({}))
vi.mock('@/infrastructure/frankfurter/client', () => ({
  fetchRate: vi.fn(),
  fetchHistorical: vi.fn(),
}))

function buildCurrency(code: string): Currency {
  const result = createCurrency(code)

  if (!result.ok) {
    throw new Error('Expected currency to be valid')
  }

  return result.value
}

function buildPair(): CurrencyPair {
  const pair = createCurrencyPair(buildCurrency('EUR'), buildCurrency('USD'))

  if (!pair.ok) {
    throw new Error('Expected pair to be valid')
  }

  return pair.value
}

beforeEach(() => {
  vi.mocked(fetchRate).mockReset()
  vi.mocked(fetchHistorical).mockReset()
})

describe('fetchRateFromFrankfurter', () => {
  it('translates a frankfurter response into an exchange rate', async () => {
    const pair = buildPair()
    vi.mocked(fetchRate).mockResolvedValue(
      ok({
        base: 'EUR',
        quote: 'USD',
        rate: 1.08,
        date: '2026-04-01',
        source: 'Frankfurter',
      }),
    )

    const result = await fetchRateFromFrankfurter(pair)

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected ok result')
    }

    expect(result.value.pair).toEqual(pair)
    expect(result.value.rate).toBeCloseTo(1.08)
    expect(result.value.timestamp.toISOString()).toBe('2026-04-01T00:00:00.000Z')
    expect(result.value.source).toBe('Frankfurter')
  })

  it('propagates infrastructure failures from the client', async () => {
    const pair = buildPair()
    const infrastructureError = createInfrastructureError('Timeout', 'Frankfurter timed out')
    vi.mocked(fetchRate).mockResolvedValue(err(infrastructureError))

    const result = await fetchRateFromFrankfurter(pair)

    expect(result).toEqual(err(infrastructureError))
  })
})

describe('fetchRateSeriesFromFrankfurter', () => {
  it('translates and sorts a historical series', async () => {
    const pair = buildPair()
    const dateRange = createDateRange(
      new Date('2026-04-01T00:00:00Z'),
      new Date('2026-04-02T00:00:00Z'),
    )

    if (!dateRange.ok) {
      throw new Error('Expected date range to be valid')
    }

    vi.mocked(fetchHistorical).mockResolvedValue(
      ok([
        { base: 'EUR', quote: 'USD', rate: 1.05, date: '2026-04-02', source: 'Frankfurter' },
        { base: 'EUR', quote: 'USD', rate: 1.08, date: '2026-04-01', source: 'Frankfurter' },
      ]),
    )

    const result = await fetchRateSeriesFromFrankfurter(pair, dateRange.value)

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected ok result')
    }

    expect(result.value.rates).toHaveLength(2)
    expect(result.value.rates[0]?.timestamp.toISOString()).toBe('2026-04-01T00:00:00.000Z')
    expect(result.value.rates[1]?.timestamp.toISOString()).toBe('2026-04-02T00:00:00.000Z')
    expect(result.value.dateRange).toEqual(dateRange.value)
  })

  it('returns a no-data error for empty periods', async () => {
    const pair = buildPair()
    const dateRange = createDateRange(
      new Date('2026-04-01T00:00:00Z'),
      new Date('2026-04-02T00:00:00Z'),
    )

    if (!dateRange.ok) {
      throw new Error('Expected date range to be valid')
    }

    vi.mocked(fetchHistorical).mockResolvedValue(ok([]))

    const result = await fetchRateSeriesFromFrankfurter(pair, dateRange.value)

    expect(result).toEqual(
      err(
        createInfrastructureError(
          'NoDataForPeriod',
          'No historical data available for the requested period',
        ),
      ),
    )
  })
})