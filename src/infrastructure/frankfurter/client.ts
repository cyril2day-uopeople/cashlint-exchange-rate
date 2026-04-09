import 'server-only'

import { createInfrastructureError, type InfrastructureError } from '@/domain-core/shared-kernel/errors'
import { err, ok, type Result } from '@/domain-core/shared-kernel/result'

export type FrankfurterRateResponse = {
  readonly base: string
  readonly quote: string
  readonly rate: number
  readonly date: string
  readonly source?: string
}

export type FrankfurterRateSeriesResponse = readonly FrankfurterRateResponse[]

const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v2'
const FRANKFURTER_TIMEOUT_MS = 10_000

function createTimeoutError(cause: unknown): InfrastructureError {
  return createInfrastructureError('Timeout', 'Frankfurter request timed out', cause)
}

function createNetworkError(cause: unknown): InfrastructureError {
  return createInfrastructureError('NetworkFailure', 'Unable to reach Frankfurter', cause)
}

function createStatusError(response: Response): InfrastructureError {
  if (response.status === 429) {
    return createInfrastructureError(
      'ExternalServiceRateLimited',
      'Frankfurter rate limited the request',
    )
  }

  if (response.status >= 500) {
    return createInfrastructureError(
      'ExternalServiceUnavailable',
      'Frankfurter is unavailable',
    )
  }

  return createInfrastructureError(
    'ExternalServiceBadRequest',
    `Frankfurter rejected the request with status ${response.status}`,
  )
}

async function requestJson<T>(url: string): Promise<Result<T, InfrastructureError>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FRANKFURTER_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return err(createStatusError(response))
    }

    try {
      return ok((await response.json()) as T)
    } catch (cause) {
      return err(
        createInfrastructureError(
          'UnexpectedResponseShape',
          'Frankfurter returned an invalid JSON payload',
          cause,
        ),
      )
    }
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      return err(createTimeoutError(cause))
    }

    return err(createNetworkError(cause))
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchRate(
  base: string,
  quote: string,
): Promise<Result<FrankfurterRateResponse, InfrastructureError>> {
  return requestJson<FrankfurterRateResponse>(
    `${FRANKFURTER_BASE_URL}/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
  )
}

export async function fetchHistorical(
  base: string,
  quote: string,
  startDate: string,
  endDate: string,
): Promise<Result<FrankfurterRateSeriesResponse, InfrastructureError>> {
  return requestJson<FrankfurterRateSeriesResponse>(
    `${FRANKFURTER_BASE_URL}/rates?from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}&base=${encodeURIComponent(base)}&quotes=${encodeURIComponent(quote)}`,
  )
}