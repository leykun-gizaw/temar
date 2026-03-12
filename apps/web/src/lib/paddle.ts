import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const paddleApiKey = process.env.PADDLE_API_KEY;

if (!paddleApiKey) {
  console.warn('[paddle] PADDLE_API_KEY is not set — Paddle SDK will not work.');
}

export const paddle = paddleApiKey
  ? new Paddle(paddleApiKey, {
      environment:
        process.env.PADDLE_ENVIRONMENT === 'production'
          ? Environment.production
          : Environment.sandbox,
    })
  : (null as unknown as Paddle);

export const PADDLE_PLANS = {
  starter: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID ?? '',
    passPerMonth: 200,
    name: 'Starter',
  },
  scholar: {
    priceId: process.env.NEXT_PUBLIC_PADDLE_SCHOLAR_PRICE_ID ?? '',
    passPerMonth: 600,
    name: 'Scholar',
  },
} as const;

export type PaddlePlan = keyof typeof PADDLE_PLANS;
