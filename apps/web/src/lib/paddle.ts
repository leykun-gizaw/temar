import {
  Environment,
  LogLevel,
  Paddle,
  type PaddleOptions,
} from '@paddle/paddle-node-sdk';

export function getPaddleInstance(): Paddle {
  const paddleOptions: PaddleOptions = {
    environment:
      (process.env.PADDLE_ENVIRONMENT as Environment) ?? Environment.sandbox,
    logLevel: LogLevel.error,
  };

  if (!process.env.PADDLE_API_KEY) {
    console.error('[paddle] PADDLE_API_KEY is missing');
  }

  return new Paddle(process.env.PADDLE_API_KEY ?? '', paddleOptions);
}

export const PADDLE_PLANS = {
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
} as const;

export type PaddlePlan = keyof typeof PADDLE_PLANS;
