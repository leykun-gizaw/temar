import { Suspense } from 'react';
import { fetchUsageLogs, fetchFilterOptions } from './actions';
import { UsageTable } from './usage-table';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsagePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters = {
    modelId: typeof params.modelId === 'string' ? params.modelId : undefined,
    operationType:
      typeof params.operationType === 'string'
        ? params.operationType
        : undefined,
    dateFrom:
      typeof params.dateFrom === 'string' ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : undefined,
    userId: typeof params.userId === 'string' ? params.userId : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    pageSize: typeof params.pageSize === 'string' ? parseInt(params.pageSize, 10) : undefined,
  };

  const [data, filterOptions] = await Promise.all([
    fetchUsageLogs(filters),
    fetchFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usage Log</h2>
        <p className="text-sm text-muted-foreground">
          Read-only audit trail of AI usage
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <UsageTable
          rows={data.rows}
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          modelOptions={filterOptions.models}
          operationOptions={filterOptions.operations}
        />
      </Suspense>
    </div>
  );
}
