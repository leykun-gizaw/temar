import type { ModelConfig } from '@temar/shared-types';

const COST_TIERS = [
  { label: 'Cheapest', max: 0.002 },
  { label: 'Low', max: 0.005 },
  { label: 'Low-Mid', max: 0.01 },
  { label: 'Mid', max: 0.03 },
  { label: 'High', max: 0.08 },
  { label: 'Expensive', max: Infinity },
] as const;

export function computeCostTier(model: ModelConfig): string {
  // Based on question_generation operation: 4000 input + 2000 output tokens
  const rawCost =
    (4000 / 1_000_000) * model.inputPricePer1M +
    (2000 / 1_000_000) * model.outputPricePer1M;
  for (const tier of COST_TIERS) {
    if (rawCost <= tier.max) return tier.label;
  }
  return 'Expensive';
}

export function computeRawCostPerRequest(model: ModelConfig): number {
  return (
    (4000 / 1_000_000) * model.inputPricePer1M +
    (2000 / 1_000_000) * model.outputPricePer1M
  );
}
