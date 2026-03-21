// ---------------------------------------------------------------------------
// Paddle — PaymentProvider adapter
// ---------------------------------------------------------------------------

import {
  Environment,
  EventName,
  LogLevel,
  Paddle,
  type EventEntity,
  type PaddleOptions,
} from '@paddle/paddle-node-sdk';
import type { PaymentProvider } from '../../provider.js';
import type {
  PaymentEvent,
  PaymentEventType,
  ManagementUrls,
  CheckoutConfig,
  PlanMapping,
  ProviderSyncResult,
} from '../../types.js';
import { registerProvider } from '../../registry.js';
import {
  getPaddlePlanMappings,
  paddlePlanKeyFromPriceId,
  getPaddleCheckoutConfig,
} from './paddle-plans.js';

// ---------------------------------------------------------------------------
// Paddle SDK singleton
// ---------------------------------------------------------------------------

let paddleInstance: Paddle | null = null;

function getPaddleInstance(): Paddle {
  if (paddleInstance) return paddleInstance;

  const paddleOptions: PaddleOptions = {
    environment:
      (process.env['PADDLE_ENVIRONMENT'] as Environment) ?? Environment.sandbox,
    logLevel: LogLevel.error,
  };

  if (!process.env['PADDLE_API_KEY']) {
    console.error('[paddle] PADDLE_API_KEY is missing');
  }

  paddleInstance = new Paddle(
    process.env['PADDLE_API_KEY'] ?? '',
    paddleOptions
  );
  return paddleInstance;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

class PaddlePaymentProvider implements PaymentProvider {
  readonly key = 'paddle' as const;

  async verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<PaymentEvent[]> {
    const signature = headers['paddle-signature'];
    const secret = process.env['PADDLE_WEBHOOK_SECRET'];

    if (!signature || !secret) {
      throw new Error('Missing webhook signature or secret');
    }

    const paddle = getPaddleInstance();
    const event = paddle.webhooks.unmarshal(
      rawBody,
      secret,
      signature
    ) as EventEntity;

    const events = await this.normalizeEvent(event);
    return events;
  }

  async syncSubscription(
    email: string,
    providerCustomerId?: string | null
  ): Promise<ProviderSyncResult | null> {
    const paddle = getPaddleInstance();
    let customerId = providerCustomerId ?? null;

    // Step 1: Find customer by email if not provided
    if (!customerId) {
      const customerCollection = paddle.customers.list({
        email: [email],
      });
      for await (const customer of customerCollection) {
        customerId = customer.id;
        break;
      }
      if (!customerId) return null;
    }

    // Step 2: Find active subscription
    const subCollection = paddle.subscriptions.list({
      customerId: [customerId],
      status: ['active', 'trialing', 'past_due'],
    });

    type ActiveSub = {
      id: string;
      status: string;
      items: { price: { id: string } }[];
      nextBilledAt: string | null;
    };

    let activeSub: ActiveSub | null = null;
    for await (const sub of subCollection) {
      activeSub = sub as unknown as ActiveSub;
      break;
    }

    if (!activeSub) {
      return {
        providerCustomerId: customerId,
        providerSubscriptionId: null,
        planKey: null,
        status: null,
        nextBilledAt: null,
      };
    }

    const priceId = activeSub.items?.[0]?.price?.id;
    const planKey = priceId ? paddlePlanKeyFromPriceId(priceId) : null;

    return {
      providerCustomerId: customerId,
      providerSubscriptionId: activeSub.id,
      planKey,
      status: activeSub.status,
      nextBilledAt: activeSub.nextBilledAt,
    };
  }

  async getManagementUrls(
    providerSubscriptionId: string
  ): Promise<ManagementUrls> {
    const paddle = getPaddleInstance();
    const subscription = await paddle.subscriptions.get(
      providerSubscriptionId
    );

    const sub = subscription as unknown as {
      managementUrls?: {
        updatePaymentMethod?: string;
        cancel?: string;
      };
    };

    return {
      updatePaymentMethod: sub.managementUrls?.updatePaymentMethod ?? null,
      cancel: sub.managementUrls?.cancel ?? null,
    };
  }

  async getNextBilledAt(
    providerSubscriptionId: string
  ): Promise<string | null> {
    const paddle = getPaddleInstance();
    const subData = await paddle.subscriptions.get(providerSubscriptionId);
    return (subData as { nextBilledAt?: string }).nextBilledAt ?? null;
  }

  planKeyFromPriceId(priceId: string): string | null {
    return paddlePlanKeyFromPriceId(priceId);
  }

  getPlanMappings(): PlanMapping[] {
    return getPaddlePlanMappings();
  }

  getCheckoutConfig(): CheckoutConfig {
    return getPaddleCheckoutConfig();
  }

  // -------------------------------------------------------------------------
  // Internal: normalize Paddle events to PaymentEvent[]
  // -------------------------------------------------------------------------

  private async normalizeEvent(event: EventEntity): Promise<PaymentEvent[]> {
    switch (event.eventType) {
      case EventName.SubscriptionActivated:
        return [await this.normalizeSubscriptionEvent(event, 'subscription.activated')];

      case EventName.SubscriptionUpdated:
        return [await this.normalizeSubscriptionEvent(event, 'subscription.updated')];

      case EventName.SubscriptionCanceled:
        return [await this.normalizeSubscriptionCanceled(event)];

      case EventName.TransactionCompleted:
        return [await this.normalizeTransactionCompleted(event)];

      case EventName.AdjustmentCreated:
        return this.normalizeAdjustment(event);

      default:
        return [];
    }
  }

  private async normalizeSubscriptionEvent(
    event: EventEntity,
    type: PaymentEventType
  ): Promise<PaymentEvent> {
    const sub = event.data as {
      id: string;
      customerId: string;
      status: string;
      items: { price: { id: string } }[];
      nextBilledAt: string | null;
      customData?: { userId?: string };
    };

    const priceId = sub.items?.[0]?.price?.id;
    const planKey = priceId ? paddlePlanKeyFromPriceId(priceId) : undefined;

    return {
      type,
      providerKey: 'paddle',
      providerEventId: event.eventId ?? '',
      userId: sub.customData?.userId ?? '',
      providerCustomerId: sub.customerId,
      providerSubscriptionId: sub.id,
      planKey: planKey ?? undefined,
      nextBilledAt: sub.nextBilledAt,
      raw: event,
    };
  }

  private async normalizeSubscriptionCanceled(
    event: EventEntity
  ): Promise<PaymentEvent> {
    const sub = event.data as {
      customerId: string;
      customData?: { userId?: string };
    };

    return {
      type: 'subscription.canceled',
      providerKey: 'paddle',
      providerEventId: event.eventId ?? '',
      userId: sub.customData?.userId ?? '',
      providerCustomerId: sub.customerId,
      raw: event,
    };
  }

  private async normalizeTransactionCompleted(
    event: EventEntity
  ): Promise<PaymentEvent> {
    const txn = event.data as {
      id: string;
      customerId: string;
      subscriptionId: string | null;
      items: { price: { id: string; type: string } }[];
      customData?: { userId?: string; topupPassAmount?: string };
    };

    // One-time top-up
    if (!txn.subscriptionId && txn.customData?.topupPassAmount) {
      return {
        type: 'topup.completed',
        providerKey: 'paddle',
        providerEventId: event.eventId ?? '',
        userId: txn.customData?.userId ?? '',
        providerCustomerId: txn.customerId,
        providerTransactionId: txn.id,
        topupPassAmount: Number(txn.customData.topupPassAmount),
        raw: event,
      };
    }

    // Subscription renewal
    const priceId = txn.items?.[0]?.price?.id;
    const planKey = priceId ? paddlePlanKeyFromPriceId(priceId) : undefined;

    // Fetch next billing date from subscription
    let nextBilledAt: string | null = null;
    if (txn.subscriptionId) {
      try {
        nextBilledAt = await this.getNextBilledAt(txn.subscriptionId);
      } catch {
        // Non-fatal — proceed without next billing date
      }
    }

    return {
      type: 'subscription.renewed',
      providerKey: 'paddle',
      providerEventId: event.eventId ?? '',
      userId: txn.customData?.userId ?? '',
      providerCustomerId: txn.customerId,
      providerSubscriptionId: txn.subscriptionId ?? undefined,
      providerTransactionId: txn.id,
      planKey: planKey ?? undefined,
      nextBilledAt,
      raw: event,
    };
  }

  private normalizeAdjustment(event: EventEntity): PaymentEvent[] {
    const adj = event.data as {
      id: string;
      action: string;
      transactionId: string;
      subscriptionId: string | null;
      customerId: string;
      status: string;
    };

    // Only act on approved refunds/chargebacks
    if (adj.status !== 'approved') return [];
    if (adj.action !== 'refund' && adj.action !== 'chargeback') return [];

    const type: PaymentEventType = adj.subscriptionId
      ? 'refund.subscription'
      : 'refund.topup';

    return [
      {
        type,
        providerKey: 'paddle',
        providerEventId: event.eventId ?? '',
        userId: '', // Resolved by event handler via providerCustomerId lookup
        providerCustomerId: adj.customerId,
        providerSubscriptionId: adj.subscriptionId ?? undefined,
        providerTransactionId: adj.transactionId,
        raw: event,
      },
    ];
  }
}

// ---------------------------------------------------------------------------
// Auto-register on import
// ---------------------------------------------------------------------------

registerProvider('paddle', () => new PaddlePaymentProvider());
