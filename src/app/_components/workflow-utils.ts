import { pipe, toUpper, trim } from 'ramda'

import { SUPPORTED_CURRENCIES } from '@/domain-core/shared-kernel/types'

const amountFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

export function formatAmount(value: number): string {
  return amountFormatter.format(value)
}

export const currencyOptions = SUPPORTED_CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} (${currency.name})`,
}))

export const normalizeCurrencyCode = pipe(trim, toUpper)

export function formatCurrencyAmount(
  amount: number,
  currency: string,
): string {
  return `${formatAmount(amount)} ${currency}`
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`
}

export function formatSignedPercent(value: number): string {
  const absoluteValue = percentFormatter.format(Math.abs(value))

  return `${value >= 0 ? '+' : '-'}${absoluteValue}%`
}

export function formatDateOnly(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

export function buildDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function buildRelativeDateInputValue(
  daysAgo: number,
  baseDate: Date = new Date(),
): string {
  const date = new Date(baseDate)

  date.setUTCDate(date.getUTCDate() - daysAgo)

  return buildDateInputValue(date)
}

export function buildRecentDateRange(
  daysAgo: number,
  baseDate: Date = new Date(),
): { readonly startDate: string; readonly endDate: string } {
  return {
    startDate: buildRelativeDateInputValue(daysAgo, baseDate),
    endDate: buildDateInputValue(baseDate),
  }
}

export function readTextField(formData: FormData, key: string): string {
  const value = formData.get(key)

  return typeof value === 'string' ? value : ''
}

export function readCurrencyCodeField(formData: FormData, key: string): string {
  return normalizeCurrencyCode(readTextField(formData, key))
}

export function readNumberField(formData: FormData, key: string): number {
  return Number(readTextField(formData, key))
}
