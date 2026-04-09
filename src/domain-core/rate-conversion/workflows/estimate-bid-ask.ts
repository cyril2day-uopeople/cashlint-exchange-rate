import { add, compose, divide, multiply, subtract } from 'ramda'

import { ok, type Result } from '@/domain-core/shared-kernel/result'
import { type AppError } from '@/domain-core/shared-kernel/errors'
import {
  unsafeCreatePositiveNumber,
  type PositiveNumber,
} from '@/domain-core/shared-kernel/types'
import type {
  BidAskEstimate,
  EstimateBidAskCommand,
  SpreadType,
} from '@/domain-core/rate-conversion/types'

const SPREAD_PERCENTAGES: Record<SpreadType, number> = {
  Online: 0.005,
  Bank: 0.02,
  StreetChanger: 0.03,
  Airport: 0.05,
}

function getSpreadPercent(spreadType: SpreadType): number {
  return SPREAD_PERCENTAGES[spreadType]
}

function calculateHalfSpread(spreadPercent: number): number {
  return divide(spreadPercent, 2)
}

function calculateAskRate(
  midRate: PositiveNumber,
  spreadPercent: number,
): PositiveNumber {
  return compose(
    unsafeCreatePositiveNumber,
    multiply(midRate),
    add(1),
    calculateHalfSpread,
  )(spreadPercent)
}

function calculateBidRate(
  midRate: PositiveNumber,
  spreadPercent: number,
): PositiveNumber {
  return compose(
    unsafeCreatePositiveNumber,
    multiply(midRate),
    subtract(1),
    calculateHalfSpread,
  )(spreadPercent)
}

function calculateSpread(
  askRate: PositiveNumber,
  bidRate: PositiveNumber,
): PositiveNumber {
  return compose(
    unsafeCreatePositiveNumber,
    Math.abs,
    subtract(bidRate),
  )(askRate)
}

function buildBidAskEstimate(
  command: EstimateBidAskCommand,
): BidAskEstimate {
  const midRate = command.exchangeRate.rate
  const spreadPercent = getSpreadPercent(command.spreadType)
  const askRate = calculateAskRate(midRate, spreadPercent)
  const bidRate = calculateBidRate(midRate, spreadPercent)

  return {
    midRate,
    bidRate,
    askRate,
    spread: calculateSpread(askRate, bidRate),
    spreadPercent,
    spreadType: command.spreadType,
  }
}

export function estimateBidAsk(
  command: EstimateBidAskCommand,
): Result<BidAskEstimate, AppError> {
  return ok(buildBidAskEstimate(command))
}