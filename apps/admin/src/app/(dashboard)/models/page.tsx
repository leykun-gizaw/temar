export const dynamic = 'force-dynamic';

import { getAllModels, getModelWarnings } from './actions';
import { AddModelDialog } from './add-model-dialog';
import { ModelsTable } from './models-table';
import { SyncModelsButton } from './sync-models-button';

export default async function ModelsPage() {
  const [models, warnings] = await Promise.all([
    getAllModels(),
    getModelWarnings(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Models</h2>
          <p className="text-sm text-muted-foreground">
            Manage registered AI models
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncModelsButton />
          <AddModelDialog />
        </div>
      </div>

      <ModelsTable models={models} warnings={warnings} />
    </div>
  );
}
