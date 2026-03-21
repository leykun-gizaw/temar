// ---------------------------------------------------------------------------
// Payment Provider — registry / factory
// ---------------------------------------------------------------------------

import type { PaymentProvider } from './provider.js';
import type { PaymentProviderKey } from './types.js';

const providers = new Map<PaymentProviderKey, () => PaymentProvider>();

/** Register a provider factory. Called at module load by each adapter. */
export function registerProvider(
  key: PaymentProviderKey,
  factory: () => PaymentProvider
): void {
  providers.set(key, factory);
}

/** Get a provider instance by key. Throws if not registered. */
export function getProvider(key: PaymentProviderKey): PaymentProvider {
  const factory = providers.get(key);
  if (!factory) {
    throw new Error(
      `Payment provider "${key}" is not registered. ` +
        `Available: ${[...providers.keys()].join(', ') || 'none'}`
    );
  }
  return factory();
}

/** Read the active provider key from environment. Defaults to 'paddle'. */
export function getActiveProviderKey(): PaymentProviderKey {
  return (process.env['PAYMENT_PROVIDER'] ?? 'paddle') as PaymentProviderKey;
}

/** Get the active provider instance based on PAYMENT_PROVIDER env var. */
export function getActiveProvider(): PaymentProvider {
  return getProvider(getActiveProviderKey());
}
