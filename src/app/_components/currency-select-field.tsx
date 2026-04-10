'use client'

import { currencyOptions } from './workflow-utils'

type CurrencySelectFieldProps = {
  readonly label: string
  readonly name: string
  readonly defaultValue: string
}

export function CurrencySelectField({
  label,
  name,
  defaultValue,
}: CurrencySelectFieldProps) {
  return (
    <label className="workflow-card__field">
      <span className="workflow-card__label">{label}</span>
      <select className="workflow-card__control" name={name} defaultValue={defaultValue}>
        {currencyOptions.map((currency) => (
          <option key={currency.value} value={currency.value}>
            {currency.label}
          </option>
        ))}
      </select>
    </label>
  )
}