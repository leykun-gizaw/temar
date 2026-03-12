// DEPRECATED: Stripe checkout route removed. Checkout is now handled via
// Paddle.js overlay on the client. See billing-client.tsx.
// This file can be deleted once all references are cleaned up.
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Stripe checkout has been replaced by Paddle. Use the billing page.',
    },
    { status: 410 }
  );
}
