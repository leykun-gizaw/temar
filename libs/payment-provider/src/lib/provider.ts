// ---------------------------------------------------------------------------
// Payment Provider — interface
// ---------------------------------------------------------------------------

import type {
  PaymentProviderKey,
  PaymentEvent,
  ManagementUrls,
  CheckoutConfig,
  PlanMapping,
  ProviderSyncResult,
} from './types.js';

/**
 * Every payment processor/MOR must implement this interface.
 * Methods map to the core data flows: webhook processing, subscription sync,
 * management portal, plan resolution, and checkout configuration.
 */
export interface PaymentProvider {
  readonly key: PaymentProviderKey;

  /**
   * Verify webhook signature, parse the raw body, and return normalized
   * PaymentEvent(s). Throws on invalid signature.
   */
  verifyAndParseWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<PaymentEvent[]>;

  /**
   * Sync subscription state from the provider API.
   * Used on billing page load to catch missed webhooks (e.g. localhost dev).
   * Returns null if no customer/subscription found.
   */
  syncSubscription(
    email: string,
    providerCustomerId?: string | null
  ): Promise<ProviderSyncResult | null>;

  /**
   * Get processor-hosted management portal URLs for a subscription.
   */
  getManagementUrls(
    providerSubscriptionId: string
  ): Promise<ManagementUrls>;

  /**
   * Get the next billing date for a subscription.
   */
  getNextBilledAt(
    providerSubscriptionId: string
  ): Promise<string | null>;

  /**
   * Resolve an internal plan key from a processor-specific price ID.
   * Returns null if the price ID is not recognized.
   */
  planKeyFromPriceId(priceId: string): string | null;

  /** Get all plan mappings for this provider. */
  getPlanMappings(): PlanMapping[];

  /** Build the checkout config to send to the client. */
  getCheckoutConfig(): CheckoutConfig;
}
