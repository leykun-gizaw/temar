export const dynamic = 'force-dynamic';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { getAllModels, getModelWarnings } from './actions';
import { AddModelDialog } from './add-model-dialog';
import { ModelToggle } from './model-toggle';
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model ID</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => (
            <TableRow key={model.id}>
              <TableCell className="font-mono text-sm">{model.id}</TableCell>
              <TableCell className="capitalize">{model.provider}</TableCell>
              <TableCell>{model.label}</TableCell>
              <TableCell>
                <Badge variant={model.isActive ? 'default' : 'secondary'}>
                  {model.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {warnings[model.id] && (
                  <div className="mt-1 flex items-start gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    <span className="text-xs text-destructive">
                      {warnings[model.id].join(', ')}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {model.createdAt
                  ? new Date(model.createdAt).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell>
                <ModelToggle
                  modelId={model.id}
                  initialActive={model.isActive}
                />
              </TableCell>
            </TableRow>
          ))}
          {models.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No models registered
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
