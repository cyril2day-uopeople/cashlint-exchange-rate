# Cashlint Exchange Rate

Cashlint Exchange Rate v3 is a domain-driven, functional Next.js workspace for exchange-rate analysis.
It is not a generic starter app. The purpose of the workspace is to model exchange-rate behavior clearly,
keep the core logic pure, and render the results with a thin UI layer.

## What This App Does

- Quick currency conversion using a current mid-market rate.
- Bid and ask estimation using fixed spread presets.
- Historical rate fetching for a currency pair over a selected date range.
- Rate analysis that computes statistics, trend direction, and volatility from a historical series.

## Architecture

The workspace is organized around a pure domain core.

- `src/domain-core` contains shared-kernel types, `Result`, domain errors, and workflows.
- `src/app` contains the Next.js UI and route entry points.
- D3 is used for data computations, statistics, and chart math.
- React is used to render the computed results and manage UI composition.

The codebase uses alias imports, named Ramda imports, and small focused workflows so the domain stays readable and easy to test.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Run the test suite:

```bash
pnpm test:run
```

Build the app:

```bash
pnpm build
```

## Scripts

- `pnpm dev` - start the Next.js development server
- `pnpm build` - build the application for production
- `pnpm start` - start the production server
- `pnpm lint` - run ESLint
- `pnpm test` - run Vitest in watch mode
- `pnpm test:run` - run Vitest once
- `pnpm test:coverage` - run Vitest with coverage

## Development Notes

- Keep domain logic inside `src/domain-core`.
- Use `@/domain-core/...` imports instead of relative paths inside domain code.
- Prefer Ramda for small pure transforms when it makes intent clearer.
- Use `map` for pure `Result` success-path transforms and `bind` only for dependent steps.
- Use D3 for the numbers and React for the rendering.

## Current Focus

The current feature set centers on an interactive workflow dashboard built on the domain core:

- quick convert
- bid/ask estimation
- historical rates
- rate analysis

Those workflows are the reason this workspace exists, and the homepage is now wired to exercise them directly.
