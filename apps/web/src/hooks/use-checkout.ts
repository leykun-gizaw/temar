'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CheckoutConfig, PaymentProviderKey } from '@temar/payment-provider';

interface UseCheckoutReturn {
  ready: boolean;
  loading: string | null;
  openCheckout: (
    priceId: string,
    customData?: Record<string, string>,
    loadingKey?: string
  ) => void;
}

/**
 * Abstracts client-side checkout SDK initialization.
 * Based on the provider key in CheckoutConfig, dynamically loads
 * the correct SDK and exposes a unified `openCheckout()` function.
 */
export function useCheckout(
  config: CheckoutConfig,
  userId: string
): UseCheckoutReturn {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdkRef = useRef<any>(null);

  useEffect(() => {
    if (sdkRef.current) return;
    if (!config.clientToken) return;

    initSdk(config.providerKey, config).then((sdk) => {
      if (sdk) {
        sdkRef.current = sdk;
        setReady(true);
      }
    });
  }, [config]);

  const openCheckout = useCallback(
    (
      priceId: string,
      customData?: Record<string, string>,
      loadingKey?: string
    ) => {
      if (!sdkRef.current || !ready) return;
      setLoading(loadingKey ?? 'checkout');

      openProviderCheckout(config.providerKey, sdkRef.current, {
        priceId,
        userId,
        customData,
      });

      setTimeout(() => setLoading(null), 2000);
    },
    [config.providerKey, userId, ready]
  );

  return { ready, loading, openCheckout };
}

// ---------------------------------------------------------------------------
// Provider-specific SDK initialization
// ---------------------------------------------------------------------------

async function initSdk(
  providerKey: PaymentProviderKey,
  config: CheckoutConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  switch (providerKey) {
    case 'paddle': {
      const { initializePaddle } = await import('@paddle/paddle-js');
      const instance = await initializePaddle({
        token: config.clientToken,
        environment: config.environment as 'sandbox' | 'production',
      });
      return instance ?? null;
    }

    case 'dodo': {
      // Dodo Payments client SDK — stub for future implementation
      console.warn('[useCheckout] Dodo Payments client SDK not yet implemented');
      return null;
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Provider-specific checkout opening
// ---------------------------------------------------------------------------

function openProviderCheckout(
  providerKey: PaymentProviderKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdk: any,
  opts: {
    priceId: string;
    userId: string;
    customData?: Record<string, string>;
  }
): void {
  switch (providerKey) {
    case 'paddle': {
      sdk.Checkout.open({
        items: [{ priceId: opts.priceId, quantity: 1 }],
        customData: { userId: opts.userId, ...opts.customData },
        settings: {
          successUrl: `${window.location.origin}/dashboard/billing?success=1`,
        },
      });
      break;
    }

    case 'dodo': {
      console.warn('[useCheckout] Dodo Payments checkout not yet implemented');
      break;
    }
  }
}
