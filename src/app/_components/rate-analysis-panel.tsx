'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { analyzeRateSeriesAction } from '../_actions/analyze-rate-series'
import type { ErrorDTO, RateAnalysisResponseDTO } from '@/dtos'

import {
  buildRecentDateRange,
  formatAmount,
  formatDateOnly,
  formatSignedPercent,
  readCurrencyCodeField,
  readTextField,
} from './workflow-utils'
import { CurrencySelectField } from './currency-select-field'
import { RateChart } from './rate-chart'

type RateAnalysisState = {
  readonly result: RateAnalysisResponseDTO | null
  readonly error: ErrorDTO | null
  readonly isSubmitting: boolean
}

type DateDefaults = {
  readonly startDate: string
  readonly endDate: string
}

const TREND_LABELS = {
  strengthening: 'Rising',
  weakening: 'Falling',
  stable: 'Steady',
} as const

const STEADINESS_LABELS = {
  Low: 'Steady',
  Medium: 'Mixed',
  High: 'Active',
} as const

function buildInitialState(): RateAnalysisState {
  return {
    result: null,
    error: null,
    isSubmitting: false,
  }
}

function buildDefaultDates(): DateDefaults {
  return buildRecentDateRange(30)
}

async function submitRateAnalysis(formData: FormData) {
  const base = readCurrencyCodeField(formData, 'base')
  const quote = readCurrencyCodeField(formData, 'quote')
  const startDate = readTextField(formData, 'startDate')
  const endDate = readTextField(formData, 'endDate')

  return analyzeRateSeriesAction({
    base,
    quote,
    startDate,
    endDate,
  })
}

function formatTrendDirection(value: RateAnalysisResponseDTO['trend']['direction']): string {
  return TREND_LABELS[value]
}

function formatSteadiness(value: RateAnalysisResponseDTO['volatility']['level']): string {
  return STEADINESS_LABELS[value]
}

function getTrendClassName(
  direction: RateAnalysisResponseDTO['trend']['direction'],
): string {
  switch (direction) {
    case 'strengthening':
      return 'workflow-card__trend-strengthening'
    case 'weakening':
      return 'workflow-card__trend-weakening'
    case 'stable':
      return 'workflow-card__trend-stable'
  }
}

export function RateAnalysisPanel() {
  const [state, setState] = useState<RateAnalysisState>(buildInitialState)
  const [defaultDates] = useState<DateDefaults>(buildDefaultDates)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    setState((currentState) => ({
      ...currentState,
      isSubmitting: true,
      error: null,
    }))

    const response = await submitRateAnalysis(formData)

    setState({
      result: response.ok ? response.value : null,
      error: response.ok ? null : response.error,
      isSubmitting: false,
    })
  }

  return (
    <article className="workflow-card">
      <header className="workflow-card__header">
        <p className="workflow-card__eyebrow">Recent trend</p>
        <h3 className="workflow-card__title">See how the rate has moved.</h3>
        <p className="workflow-card__copy">
          A quick read on whether the pair has been steady, drifting, or moving more sharply lately.
        </p>
      </header>

      <form className="workflow-card__form" onSubmit={handleSubmit}>
        <div className="workflow-card__field-grid">
          <CurrencySelectField label="Base" name="base" defaultValue="EUR" />

          <CurrencySelectField label="Quote" name="quote" defaultValue="USD" />

          <label className="workflow-card__field">
            <span className="workflow-card__label">Start date</span>
            <input
              className="workflow-card__control"
              name="startDate"
              type="date"
              defaultValue={defaultDates.startDate}
            />
          </label>

          <label className="workflow-card__field">
            <span className="workflow-card__label">End date</span>
            <input
              className="workflow-card__control"
              name="endDate"
              type="date"
              defaultValue={defaultDates.endDate}
            />
          </label>
        </div>

        <div className="workflow-card__button-row">
          <button className="workflow-card__button" type="submit" disabled={state.isSubmitting}>
            {state.isSubmitting ? 'Analyzing…' : 'Analyze series'}
          </button>
        </div>
      </form>

      {state.error ? (
        <section className="workflow-card__error" role="alert" aria-live="assertive">
          <strong className="workflow-card__error-title">{state.error.error.code}</strong>
          <p className="workflow-card__error-text">{state.error.error.message}</p>
        </section>
      ) : null}

      {state.result ? (
        <section className="workflow-card__analysis" aria-live="polite">
          <section className="workflow-card__result">
            <div className="workflow-card__result-grid">
              <div className="workflow-card__result-group">
                <span className="workflow-card__result-label">Current</span>
                <strong className="workflow-card__result-value">{formatAmount(state.result.statistics.current)}</strong>
              </div>
              <div className="workflow-card__result-group">
                <span className="workflow-card__result-label">Average</span>
                <strong className="workflow-card__result-value">{formatAmount(state.result.statistics.average)}</strong>
              </div>
              <div className="workflow-card__result-group">
                <span className="workflow-card__result-label">Low</span>
                <strong className="workflow-card__result-value">{formatAmount(state.result.statistics.minimum)}</strong>
              </div>
              <div className="workflow-card__result-group">
                <span className="workflow-card__result-label">High</span>
                <strong className="workflow-card__result-value">{formatAmount(state.result.statistics.maximum)}</strong>
              </div>
              <div className="workflow-card__result-group">
                <span className="workflow-card__result-label">Range</span>
                <strong className="workflow-card__result-value">{formatAmount(state.result.statistics.range)}</strong>
              </div>
              <div className="workflow-card__result-group">
                <span className="workflow-card__result-label">Points</span>
                <strong className="workflow-card__result-value">{state.result.statistics.dataPoints}</strong>
              </div>
            </div>

            <div className="workflow-card__result-narrative">
              <div className="workflow-card__result-narrative-item">
                <span className="workflow-card__result-label">Direction</span>
                <strong className={`workflow-card__result-value ${getTrendClassName(state.result.trend.direction)}`}>
                  {formatTrendDirection(state.result.trend.direction)}
                </strong>
              </div>
              <div className="workflow-card__result-narrative-item">
                <span className="workflow-card__result-label">Change vs average</span>
                <strong className="workflow-card__result-value">{formatSignedPercent(state.result.trend.percentChange)}</strong>
              </div>
              <div className="workflow-card__result-narrative-item">
                <span className="workflow-card__result-label">Compared with</span>
                <strong className="workflow-card__result-value">
                  {state.result.trend.comparedTo === 'average' ? 'Average' : 'Start'}
                </strong>
              </div>
              <div className="workflow-card__result-narrative-item">
                <span className="workflow-card__result-label">Steadiness</span>
                <strong className="workflow-card__result-value">
                  {formatSteadiness(state.result.volatility.level)}
                </strong>
              </div>
            </div>

            <p className="workflow-card__result-note">
              Across {formatDateOnly(state.result.series.startDate)} to{' '}
              {formatDateOnly(state.result.series.endDate)}, this view shows the current rate, the
              average, the low and high points, and the overall direction.
            </p>
          </section>

          <RateChart rates={state.result.series.rates} />

          <section className="workflow-card__interpretation">
            <p className="workflow-card__interpretation-text">
              {state.result.volatility.interpretation}
            </p>
          </section>
        </section>
      ) : null}

      <p className="workflow-card__note">
        The summary is based on Frankfurter's published rates for the date range you picked.
      </p>
    </article>
  )
}
