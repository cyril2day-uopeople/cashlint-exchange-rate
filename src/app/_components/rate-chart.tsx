'use client'

import { curveMonotoneX, extent, line, scaleLinear } from 'd3'

import type { RatePointDTO } from '@/dtos'

import { formatAmount, formatDateOnly } from './workflow-utils'

type ChartPoint = {
  readonly index: number
  readonly rate: number
  readonly date: string
}

type RateChartProps = {
  readonly rates: readonly RatePointDTO[]
}

function buildChartPoints(rates: readonly RatePointDTO[]): ChartPoint[] {
  return rates.map((point, index) => ({
    index,
    rate: point.rate,
    date: point.date,
  }))
}

function buildRateDomain(points: readonly ChartPoint[]): [number, number] {
  const [minimum, maximum] = extent(points, (point) => point.rate)

  if (minimum === undefined || maximum === undefined) {
    return [0, 1]
  }

  if (minimum === maximum) {
    return [minimum - 1, maximum + 1]
  }

  return [minimum, maximum]
}

export function RateChart({ rates }: RateChartProps) {
  if (rates.length === 0) {
    return <p className="rate-chart__empty">No historical data to chart.</p>
  }

  const width = 600
  const height = 220
  const padding = 28
  const points = buildChartPoints(rates)
  const [minimumRate, maximumRate] = buildRateDomain(points)
  const xScale = scaleLinear()
    .domain([0, Math.max(points.length - 1, 1)])
    .range([padding, width - padding])
  const yScale = scaleLinear()
    .domain([minimumRate, maximumRate])
    .nice()
    .range([height - padding, padding])
  const pathGenerator = line<ChartPoint>()
    .x((point) => xScale(point.index))
    .y((point) => yScale(point.rate))
    .curve(curveMonotoneX)
  const path = pathGenerator(points) ?? ''
  const latestPoint = points[points.length - 1]
  const firstPoint = points[0]

  const chartMetaItems = [
    {
      label: 'Period',
      value: `${formatDateOnly(firstPoint.date)} - ${formatDateOnly(latestPoint.date)}`,
    },
    {
      label: 'Min',
      value: formatAmount(minimumRate),
    },
    {
      label: 'Max',
      value: formatAmount(maximumRate),
    },
    {
      label: 'Latest',
      value: formatAmount(latestPoint.rate),
    },
  ] as const

  return (
    <figure className="rate-chart" aria-label="Historical exchange rate chart">
      <svg
        className="rate-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Historical rate trend"
        preserveAspectRatio="none"
      >
        <path className="rate-chart__line" d={path} />
        {points.map((point) => (
          <circle
            key={`${point.date}-${point.index}`}
            className="rate-chart__point"
            cx={xScale(point.index)}
            cy={yScale(point.rate)}
            r={3.75}
          />
        ))}
      </svg>

      <figcaption className="rate-chart__caption">
        <ul className="rate-chart__meta">
          {chartMetaItems.map((item) => (
            <li key={item.label} className="rate-chart__meta-item">
              <span className="rate-chart__meta-label">{item.label}</span>
              <strong className="rate-chart__meta-value">{item.value}</strong>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
