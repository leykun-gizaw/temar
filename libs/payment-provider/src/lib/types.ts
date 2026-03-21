// ---------------------------------------------------------------------------
// Payment Provider — shared types
// ---------------------------------------------------------------------------

/** Supported payment processor keys. Extend as new providers are added. */
export type PaymentProviderKey = 'paddle' | 'dodo';

/** Normalized event types emitted by any payment provider. */
export type PaymentEventType =
  | 'subscription.activated'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.renewed'
  | 'topup.completed'
  | 'refund.subscription'
  | 'refund.topup';

/** Processor-agnostic payment event, produced by provider adapters. */
export interface PaymentEvent {
  type: PaymentEventType;
  providerKey: PaymentProviderKey;
  providerEventId: string;
  userId: string;
  providerCustomerId: string;
  providerSubscriptionId?: string;
  providerTransactionId?: string;
  planKey?: string;
  nextBilledAt?: string | null;
  topupPassAmount?: number;
  refundAmountUsd?: number;
  raw: unknown;
}

/** Subscription info returned to the billing page. */
export interface SubscriptionInfo {
  plan: string;
  status: string | null;
  providerSubscriptionId: string | null;
  nextBilledAt: string | null;
  passResetAt: string | null;
  balance: number;
}

/** URLs for processor-hosted subscription management portals. */
export interface ManagementUrls {
  updatePaymentMethod: string | null;
  cancel: string | null;
}

/** Maps a processor-specific price ID to an internal plan. */
export interface PlanMapping {
  priceId: string;
  planKey: string;
  passPerMonth: number;
  name: string;
}

/** Configuration sent from server to client for checkout UI. */
export interface CheckoutConfig {
  providerKey: PaymentProviderKey;
  clientToken: string;
  environment: string;
  plans: Record<string, { priceId: string }>;
  topupPacks: Array<{
    id: string;
    pass: number;
    price: string;
    priceId: string;
  }>;
}

/** Result from syncing subscription state with the provider API. */
export interface ProviderSyncResult {
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  planKey: string | null;
  status: string | null;
  nextBilledAt: string | null;
}
