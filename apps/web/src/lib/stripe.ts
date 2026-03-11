import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

export const STRIPE_PLANS = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? '',
    passPerMonth: 200,
    name: 'Starter',
  },
  scholar: {
    priceId: process.env.STRIPE_SCHOLAR_PRICE_ID ?? '',
    passPerMonth: 600,
    name: 'Scholar',
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
