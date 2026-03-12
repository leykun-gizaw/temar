// DEPRECATED: Stripe webhook removed. See /api/paddle/webhook for the replacement.
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe webhooks have been replaced by Paddle.' },
    { status: 410 }
  );
}
