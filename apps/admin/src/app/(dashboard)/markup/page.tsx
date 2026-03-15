export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { fetchModelsWithMarkup } from './actions';
import { computeCostTier, computeRawCostPerRequest } from './cost-utils';
import { MarkupTable } from './markup-table';

export default async function MarkupPage() {
  const models = await fetchModelsWithMarkup();

  const costTiers: Record<string, string> = {};
  const rawCosts: Record<string, number> = {};
  for (const m of models) {
    costTiers[m.modelId] = computeCostTier(m);
    rawCosts[m.modelId] = computeRawCostPerRequest(m);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Markup</h2>
        <p className="text-sm text-muted-foreground">
          Manage per-model business margins (versioned, append-only)
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-800">
            Markup factors follow an inverse curve — cheaper models should carry
            higher markup, expensive models lower markup. See the seed script
            for suggested ranges per cost tier.
          </p>
        </CardContent>
      </Card>

      <MarkupTable models={models} costTiers={costTiers} rawCosts={rawCosts} />
    </div>
  );
}
