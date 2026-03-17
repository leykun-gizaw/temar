export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { fetchAllOperations } from './actions';
import { OperationsTable } from './operations-table';

export default async function OperationsPage() {
  const operations = await fetchAllOperations();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Operations</h2>
        <p className="text-sm text-muted-foreground">
          Manage operation type configurations and token budgets
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Operation types are defined as an enum in application code. Adding
            or removing operation types requires a code change — only existing
            operations can be edited here.
          </p>
        </CardContent>
      </Card>

      <OperationsTable operations={operations} />
    </div>
  );
}
