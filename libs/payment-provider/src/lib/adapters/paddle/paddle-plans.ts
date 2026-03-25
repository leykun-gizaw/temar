// ---------------------------------------------------------------------------
// Paddle — plan mappings and checkout config
// ---------------------------------------------------------------------------

import type { PlanMapping, CheckoutConfig } from '../../types.js';

export interface PaddlePlanConfig {
  priceId: string;
  passPerMonth: number;
  name: string;
}

export function getPaddlePlans(): Record<string, PaddlePlanConfig> {
  return {
    starter: {
      priceId: process.env['NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID'] ?? '',
      passPerMonth: 100,
      name: 'Starter',
    },
    hobbyist: {
      priceId: process.env['NEXT_PUBLIC_PADDLE_HOBBYIST_PRICE_ID'] ?? '',
      passPerMonth: 200,
      name: 'Hobbyist',
    },
    scholar: {
      priceId: process.env['NEXT_PUBLIC_PADDLE_SCHOLAR_PRICE_ID'] ?? '',
      passPerMonth: 300,
      name: 'Scholar',
    },
  };
}

export function getPaddlePlanMappings(): PlanMapping[] {
  const plans = getPaddlePlans();
  return Object.entries(plans).map(([planKey, cfg]) => ({
    priceId: cfg.priceId,
    planKey,
    passPerMonth: cfg.passPerMonth,
    name: cfg.name,
  }));
}

export function paddlePlanKeyFromPriceId(priceId: string): string | null {
  const plans = getPaddlePlans();
  const entry = Object.entries(plans).find(([, v]) => v.priceId === priceId);
  return entry ? entry[0] : null;
}

export function getPaddleCheckoutConfig(): CheckoutConfig {
  const plans = getPaddlePlans();
  return {
    providerKey: 'paddle',
    clientToken: process.env['NEXT_PUBLIC_PADDLE_CLIENT_TOKEN'] ?? '',
    environment: process.env['PADDLE_ENVIRONMENT'] || 'sandbox',
    plans: Object.fromEntries(
      Object.entries(plans).map(([key, cfg]) => [
        key,
        { priceId: cfg.priceId },
      ])
    ),
    topupPacks: [
      {
        id: 'topup_50',
        pass: 50,
        price: '$2.49',
        priceId: process.env['NEXT_PUBLIC_PADDLE_TOPUP_50_PRICE_ID'] ?? '',
      },
      {
        id: 'topup_100',
        pass: 100,
        price: '$4.99',
        priceId: process.env['NEXT_PUBLIC_PADDLE_TOPUP_100_PRICE_ID'] ?? '',
      },
    ],
  };
}
