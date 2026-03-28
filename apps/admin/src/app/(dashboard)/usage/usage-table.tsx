'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@temar/ui';

function generatePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  if (total > 1) pages.push(total);
  return pages;
}

interface UsageRow {
  id: string;
  userId: string;
  modelId: string;
  operationType: string;
  inputTokens: number;
  outputTokens: number;
  computedCostUsd: number;
  markupFactorSnapshot: number;
  inputPricePer1MSnapshot: number;
  outputPricePer1MSnapshot: number;
  amountChargedUsd: number;
  isByok: boolean;
  createdAt: Date | null;
}

interface FilterOption {
  id?: string;
  type?: string;
  label: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface UsageTableProps {
  rows: UsageRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  modelOptions: FilterOption[];
  operationOptions: FilterOption[];
}

export function UsageTable({
  rows,
  total,
  page,
  pageSize,
  totalPages,
  modelOptions,
  operationOptions,
}: UsageTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') params.delete('page');
      router.push(`/usage?${params.toString()}`);
    },
    [router, searchParams]
  );

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/usage?${params.toString()}`);
  }

  function computeRawCost(row: UsageRow): number {
    const inputCost =
      (row.inputTokens / 1_000_000) * row.inputPricePer1MSnapshot;
    const outputCost =
      (row.outputTokens / 1_000_000) * row.outputPricePer1MSnapshot;
    return inputCost + outputCost;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Model</Label>
          <Select
            value={searchParams.get('modelId') ?? 'all'}
            onValueChange={(v) => updateParams('modelId', v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {modelOptions.map((m) => (
                <SelectItem key={m.id} value={m.id ?? ''}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Operation</Label>
          <Select
            value={searchParams.get('operationType') ?? 'all'}
            onValueChange={(v) => updateParams('operationType', v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operations</SelectItem>
              {operationOptions.map((o) => (
                <SelectItem key={o.type} value={o.type ?? ''}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="w-[150px]"
            value={searchParams.get('dateFrom') ?? ''}
            onChange={(e) => updateParams('dateFrom', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="w-[150px]"
            value={searchParams.get('dateTo') ?? ''}
            onChange={(e) => updateParams('dateTo', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">User ID</Label>
          <Input
            className="w-[220px]"
            placeholder="Exact match"
            defaultValue={searchParams.get('userId') ?? ''}
            onBlur={(e) => updateParams('userId', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')
                updateParams('userId', (e.target as HTMLInputElement).value);
            }}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{total} total records</p>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Operation</TableHead>
            <TableHead>Input Tokens</TableHead>
            <TableHead>Output Tokens</TableHead>
            <TableHead>Raw Cost</TableHead>
            <TableHead>Marked-Up Cost</TableHead>
            <TableHead>Charged (USD)</TableHead>
            <TableHead>BYOK</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-xs">
                {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
              </TableCell>
              <TableCell className="max-w-[120px] truncate font-mono text-xs">
                {row.userId}
              </TableCell>
              <TableCell className="font-mono text-xs">{row.modelId}</TableCell>
              <TableCell className="text-xs">{row.operationType}</TableCell>
              <TableCell>{row.inputTokens.toLocaleString()}</TableCell>
              <TableCell>{row.outputTokens.toLocaleString()}</TableCell>
              <TableCell className="text-xs">
                ${computeRawCost(row).toFixed(6)}
              </TableCell>
              <TableCell className="text-xs">
                ${row.computedCostUsd.toFixed(6)}
              </TableCell>
              <TableCell className="text-xs">${row.amountChargedUsd.toFixed(6)}</TableCell>
              <TableCell>
                {row.isByok ? <Badge variant="secondary">BYOK</Badge> : '—'}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center text-muted-foreground"
              >
                No usage records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} items)
            </p>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { updateParams('pageSize', v); }}
            >
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goToPage(page - 1)}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {generatePageNumbers(page, totalPages).map((pageNum, i) =>
                pageNum === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => goToPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => goToPage(page + 1)}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
