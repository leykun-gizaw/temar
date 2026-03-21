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
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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

interface UsageTableProps {
  rows: UsageRow[];
  total: number;
  page: number;
  totalPages: number;
  modelOptions: FilterOption[];
  operationOptions: FilterOption[];
}

export function UsageTable({
  rows,
  total,
  page,
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
