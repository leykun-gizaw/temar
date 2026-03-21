// ---------------------------------------------------------------------------
// Dodo Payments — PaymentProvider adapter (stub)
// ---------------------------------------------------------------------------

import type { PaymentProvider } from '../../provider.js';
import type {
  PaymentEvent,
  ManagementUrls,
  CheckoutConfig,
  PlanMapping,
  ProviderSyncResult,
} from '../../types.js';
import { registerProvider } from '../../registry.js';

class DodoPaymentProvider implements PaymentProvider {
  readonly key = 'dodo' as const;

  async verifyAndParseWebhook(
    _rawBody: string,
    _headers: Record<string, string>
  ): Promise<PaymentEvent[]> {
    throw new Error('Dodo Payments adapter is not yet implemented');
  }

  async syncSubscription(
    _email: string,
    _providerCustomerId?: string | null
  ): Promise<ProviderSyncResult | null> {
    throw new Error('Dodo Payments adapter is not yet implemented');
  }

  async getManagementUrls(
    _providerSubscriptionId: string
  ): Promise<ManagementUrls> {
    throw new Error('Dodo Payments adapter is not yet implemented');
  }

  async getNextBilledAt(
    _providerSubscriptionId: string
  ): Promise<string | null> {
    throw new Error('Dodo Payments adapter is not yet implemented');
  }

  planKeyFromPriceId(_priceId: string): string | null {
    throw new Error('Dodo Payments adapter is not yet implemented');
  }

  getPlanMappings(): PlanMapping[] {
    throw new Error('Dodo Payments adapter is not yet implemented');
  }

  getCheckoutConfig(): CheckoutConfig {
    throw new Error('Dodo Payments adapter is not yet implemented');
  }
}

// ---------------------------------------------------------------------------
// Auto-register on import
// ---------------------------------------------------------------------------

registerProvider('dodo', () => new DodoPaymentProvider());
