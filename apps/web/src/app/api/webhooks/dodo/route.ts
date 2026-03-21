import { NextRequest, NextResponse } from 'next/server';
import {
  getProvider,
  processPaymentEvent,
} from '@temar/payment-provider';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let events;
  try {
    const provider = getProvider('dodo');
    events = await provider.verifyAndParseWebhook(body, headers);
  } catch (err) {
    console.error('[webhook/dodo] Verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    for (const event of events) {
      await processPaymentEvent(event);
    }
  } catch (err) {
    console.error('[webhook/dodo] Event processing failed:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
