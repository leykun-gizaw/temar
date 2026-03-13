// DEPRECATED: Stripe portal route removed. Subscription management is now
// handled via Paddle cancel/update URLs. See /api/paddle/manage route.
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json(
    {
      error: 'Stripe portal has been replaced by Paddle. Use the billing page.',
    },
    { status: 410 }
  );
}
