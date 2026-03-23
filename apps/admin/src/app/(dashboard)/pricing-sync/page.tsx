export const dynamic = 'force-dynamic';

import { PricingSyncClient } from './pricing-sync-client';

export default function PricingSyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pricing Sync</h2>
        <p className="text-sm text-muted-foreground">
          Fetch latest model pricing from pricepertoken and apply changes
        </p>
      </div>
      <PricingSyncClient />
    </div>
  );
}
