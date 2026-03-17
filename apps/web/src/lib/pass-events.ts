import { PASS_BALANCE_EVENT } from '@/components/pass-balance-chip';

/**
 * Dispatch a real-time pass balance update to the PassBalanceChip in the header.
 * Call this from any client component after a server action returns a newBalance.
 */
export function notifyPassBalanceChanged(newBalance?: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(PASS_BALANCE_EVENT, {
      detail: newBalance != null ? { newBalance } : undefined,
    })
  );
}
