export const dynamic = 'force-dynamic';

import { fetchModelsWithPricing } from './actions';
import { PricingTable } from './pricing-table';

export default async function PricingPage() {
  const models = await fetchModelsWithPricing();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Manage provider pricing per model (versioned, append-only)
        </p>
      </div>
      <PricingTable models={models} />
    </div>
  );
}
