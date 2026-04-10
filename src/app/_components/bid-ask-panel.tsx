'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { estimateBidAskAction } from '../_actions/estimate-bid-ask'
import type { BidAskEstimateDTO, ErrorDTO, SpreadType } from '@/dtos'

import {
  buildDateInputValue,
  formatAmount,
  formatDateTime,
  formatPercent,
  readCurrencyCodeField,
  readNumberField,
  readTextField,
} from './workflow-utils'
import { CurrencySelectField } from './currency-select-field'

type BidAskState = {
  readonly result: BidAskEstimateDTO | null
  readonly error: ErrorDTO | null
  readonly isSubmitting: boolean
}

const SPREAD_OPTIONS: readonly SpreadType[] = [
  'Online',
  'Bank',
  'StreetChanger',
  'Airport',
]

function buildInitialState(): BidAskState {
  return {
    result: null,
    error: null,
    isSubmitting: false,
  }
}

async function submitBidAsk(formData: FormData) {
  const base = readCurrencyCodeField(formData, 'base')
  const quote = readCurrencyCodeField(formData, 'quote')
  const rate = readNumberField(formData, 'rate')
  const date = readTextField(formData, 'date')
  const source = readTextField(formData, 'source') || 'Frankfurter'
  const spreadType = readTextField(formData, 'spreadType') as SpreadType

  return estimateBidAskAction({
    rate: {
      base,
      quote,
      rate,
      date,
      source,
    },
    spreadType,
  })
}

export function BidAskPanel() {
  const [state, setState] = useState<BidAskState>(buildInitialState)
  const [today] = useState(() => buildDateInputValue(new Date()))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    setState((currentState) => ({
      ...currentState,
      isSubmitting: true,
      error: null,
    }))

    const response = await submitBidAsk(formData)

    setState({
      result: response.ok ? response.value : null,
      error: response.ok ? null : response.error,
      isSubmitting: false,
    })
  }

  return (
    <article className="workflow-card">
      <header className="workflow-card__header">
        <p className="workflow-card__eyebrow">Practical estimate</p>
        <h3 className="workflow-card__title">See a more cautious price.</h3>
        <p className="workflow-card__copy">
          This shows how the headline rate can shift once a provider adds its own margin.
        </p>
      </header>

      <form className="workflow-card__form" onSubmit={handleSubmit}>
        <div className="workflow-card__field-grid">
          <CurrencySelectField label="Base" name="base" defaultValue="USD" />

          <CurrencySelectField label="Quote" name="quote" defaultValue="EUR" />

          <label className="workflow-card__field">
            <span className="workflow-card__label">Reference rate</span>
            <input
              className="workflow-card__control"
              name="rate"
              type="number"
              min="0"
              step="0.0001"
              defaultValue="1.08"
            />
          </label>

          <label className="workflow-card__field">
            <span className="workflow-card__label">Date</span>
            <input className="workflow-card__control" name="date" type="date" defaultValue={today} />
          </label>

          <label className="workflow-card__field">
            <span className="workflow-card__label">Source</span>
            <input
              className="workflow-card__control"
              name="source"
              defaultValue="Frankfurter"
            />
          </label>

          <label className="workflow-card__field">
            <span className="workflow-card__label">Price profile</span>
            <select className="workflow-card__control" name="spreadType" defaultValue="Bank">
              {SPREAD_OPTIONS.map((spreadType) => (
                <option key={spreadType} value={spreadType}>
                  {spreadType}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="workflow-card__button-row">
          <button className="workflow-card__button" type="submit" disabled={state.isSubmitting}>
            {state.isSubmitting ? 'Estimating…' : 'Estimate spread'}
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
              <span className="workflow-card__result-label">Reference</span>
              <strong className="workflow-card__result-value">{formatAmount(state.result.midRate)}</strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">Buy</span>
              <strong className="workflow-card__result-value">{formatAmount(state.result.bidRate)}</strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">Sell</span>
              <strong className="workflow-card__result-value">{formatAmount(state.result.askRate)}</strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">Gap</span>
              <strong className="workflow-card__result-value">{formatAmount(state.result.spread)}</strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">Gap %</span>
              <strong className="workflow-card__result-value">{formatPercent(state.result.spreadPercent)}</strong>
            </div>
            <div className="workflow-card__result-group">
              <span className="workflow-card__result-label">Profile</span>
              <strong className="workflow-card__result-value">{state.result.spreadType}</strong>
            </div>
          </div>

          <p className="workflow-card__result-note">
            Calculated {formatDateTime(state.result.timestamp)} from Frankfurter's published rate.
          </p>
        </section>
      ) : null}

      <p className="workflow-card__note">
        This is a guide, not a quote. It helps you compare the headline rate with a more cautious
        price.
      </p>
    </article>
  )
}
