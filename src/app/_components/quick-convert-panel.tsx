'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { quickConvertAction } from '../_actions/quick-convert'
import type { ErrorDTO, QuickConvertResponseDTO } from '@/dtos'

import {
  formatCurrencyAmount,
  formatDateTime,
  formatAmount,
  readCurrencyCodeField,
  readNumberField,
} from './workflow-utils'
import { CurrencySelectField } from './currency-select-field'

type QuickConvertState = {
  readonly result: QuickConvertResponseDTO | null
  readonly error: ErrorDTO | null
  readonly isSubmitting: boolean
}

const INITIAL_STATE: QuickConvertState = {
  result: null,
  error: null,
  isSubmitting: false,
}

async function submitQuickConvert(formData: FormData) {
  const amount = readNumberField(formData, 'amount')
  const from = readCurrencyCodeField(formData, 'from')
  const to = readCurrencyCodeField(formData, 'to')

  return quickConvertAction({ amount, from, to })
}

export function QuickConvertPanel() {
  const [state, setState] = useState<QuickConvertState>(INITIAL_STATE)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    setState((currentState) => ({
      ...currentState,
      isSubmitting: true,
      error: null,
    }))

    const response = await submitQuickConvert(formData)

    setState({
      result: response.ok ? response.value : null,
      error: response.ok ? null : response.error,
      isSubmitting: false,
    })
  }

  return (
    <article className="workflow-card">
      <header className="workflow-card__header">
        <p className="workflow-card__eyebrow">Quick answer</p>
        <h3 className="workflow-card__title">See one currency in another.</h3>
        <p className="workflow-card__copy">
          A quick way to check what your money is worth in a different currency.
        </p>
      </header>

      <form className="workflow-card__form" onSubmit={handleSubmit}>
        <div className="workflow-card__field-grid">
          <label className="workflow-card__field">
            <span className="workflow-card__label">Amount</span>
            <input
              className="workflow-card__control"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue="100"
            />
          </label>

          <CurrencySelectField label="From" name="from" defaultValue="USD" />

          <CurrencySelectField label="To" name="to" defaultValue="EUR" />
        </div>

        <div className="workflow-card__button-row">
          <button className="workflow-card__button" type="submit" disabled={state.isSubmitting}>
            {state.isSubmitting ? 'Converting…' : 'Convert now'}
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
        <section className="workflow-card__result" aria-live="polite">
          <div className="workflow-card__result-grid">
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">From</span>
              <strong className="workflow-card__result-value">
                {formatCurrencyAmount(state.result.from.amount, state.result.from.currency)}
              </strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">To</span>
              <strong className="workflow-card__result-value">
                {formatCurrencyAmount(state.result.to.amount, state.result.to.currency)}
              </strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">Rate</span>
              <strong className="workflow-card__result-value">{formatAmount(state.result.rate.rate)}</strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">Inverse</span>
              <strong className="workflow-card__result-value">{formatAmount(state.result.inverseRate)}</strong>
            </div>
          </div>

          <p className="workflow-card__result-note">
            Updated {formatDateTime(state.result.calculatedAt)} with Frankfurter's published rate.
          </p>
        </section>
      ) : null}

      <p className="workflow-card__note">
        Frankfurter serves rates gathered from central banks and other official sources, including
        the European Central Bank, so the number here is a published rate rather than a guess.
      </p>
    </article>
  )
}
