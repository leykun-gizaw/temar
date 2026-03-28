'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Check, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Checkbox,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@temar/ui';
import {
  fetchAndComparePricing,
  applyPricingChanges,
  type PricingDiffRow,
  type DiffStatus,
  type FetchResult,
} from './actions';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

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

const STATUS_FILTERS: { label: string; value: DiffStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Changed', value: 'changed' },
  { label: 'New', value: 'new' },
  { label: 'Unchanged', value: 'unchanged' },
];

function statusBadge(status: DiffStatus) {
  switch (status) {
    case 'changed':
      return (
        <Badge className="bg-accent text-accent-foreground border-accent hover:bg-accent">
          Changed
        </Badge>
      );
    case 'new':
      return (
        <Badge className="bg-secondary text-secondary-foreground border-secondary hover:bg-secondary">
          New
        </Badge>
      );
    case 'unchanged':
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          No change
        </Badge>
      );
  }
}

function priceCell(
  current: number | null,
  latest: number,
  status: DiffStatus
) {
  if (status === 'new') {
    return <span className="text-secondary-foreground">${latest.toFixed(3)}</span>;
  }
  if (status === 'unchanged' || current === null) {
    return <span>${latest.toFixed(3)}</span>;
  }
  return (
    <span>
      <span className="text-muted-foreground line-through">
        ${current.toFixed(3)}
      </span>
      <span className="mx-1 text-muted-foreground">&rarr;</span>
      <span className="font-medium text-accent-foreground">${latest.toFixed(3)}</span>
    </span>
  );
}

export function PricingSyncClient() {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<DiffStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await fetchAndComparePricing();
      setResult(res);

      // Auto-select changed and new models
      const autoSelect = new Set(
        res.diff
          .filter((r) => r.status === 'changed' || r.status === 'new')
          .map((r) => r.modelId)
      );
      setSelected(autoSelect);

      if (res.errors.length > 0) {
        res.errors.forEach((e) => toast.warning(e));
      }

      const changed = res.diff.filter((r) => r.status === 'changed').length;
      const newCount = res.diff.filter((r) => r.status === 'new').length;
      toast.success(
        `Fetched ${res.fetchedCount} models. ${changed} changed, ${newCount} new.`
      );
    } catch (err) {
      toast.error(
        `Failed to fetch pricing: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result || selected.size === 0) return;
    setApplying(true);
    try {
      const changes = result.diff
        .filter((r) => selected.has(r.modelId))
        .map((r) => ({
          modelId: r.modelId,
          provider: r.provider,
          label: r.label,
          inputPricePer1M: r.latestInput,
          outputPricePer1M: r.latestOutput,
          isNew: r.status === 'new',
        }));

      const res = await applyPricingChanges(changes);

      if (res.errors.length > 0) {
        res.errors.forEach((e) => toast.error(e));
      }
      toast.success(`Updated pricing for ${res.applied} model(s)`);

      // Re-fetch to show updated state
      const refreshed = await fetchAndComparePricing();
      setResult(refreshed);
      setSelected(new Set());
    } catch (err) {
      toast.error(
        `Apply failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setApplying(false);
    }
  };

  const toggleSelect = (modelId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  };

  const toggleAll = (rows: PricingDiffRow[]) => {
    const actionable = rows.filter((r) => r.status !== 'unchanged');
    const allSelected = actionable.every((r) => selected.has(r.modelId));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        actionable.forEach((r) => next.delete(r.modelId));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        actionable.forEach((r) => next.add(r.modelId));
        return next;
      });
    }
  };

  const filteredRows = useMemo(() => {
    if (!result) return [];
    return filter === 'all'
      ? result.diff
      : result.diff.filter((r) => r.status === filter);
  }, [result, filter]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const selectedCount = selected.size;

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result && (
            <p className="text-xs text-muted-foreground">
              Last checked:{' '}
              {new Date(result.checkedAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {' — '}
              {result.fetchedCount} models from 3 providers
            </p>
          )}
        </div>
        <Button onClick={handleFetch} disabled={loading || applying} size="sm">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          {loading ? 'Fetching...' : 'Check for Updates'}
        </Button>
      </div>

      {/* Info card */}
      {!result && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
          <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How it works</p>
            <p className="mt-1">
              Click &ldquo;Check for Updates&rdquo; to fetch the latest pricing
              from Google, Anthropic, and Deepseek via the pricepertoken MCP
              server. You&apos;ll see a diff of what changed, and can choose
              which updates to apply.
            </p>
          </div>
        </div>
      )}

      {/* Errors */}
      {result && result.errors.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Provider errors</p>
            {result.errors.map((e, i) => (
              <p key={i} className="text-muted-foreground">
                {e}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs + apply button */}
      {result && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => {
              const count =
                f.value === 'all'
                  ? result.diff.length
                  : result.diff.filter((r) => r.status === f.value).length;
              return (
                <Button
                  key={f.value}
                  variant={filter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter(f.value); setCurrentPage(1); }}
                  className="text-xs"
                >
                  {f.label} ({count})
                </Button>
              );
            })}
          </div>
          {selectedCount > 0 && (
            <Button
              onClick={handleApply}
              disabled={applying}
              size="sm"
              className="gap-1.5"
            >
              {applying ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Apply {selectedCount} selected
            </Button>
          )}
        </div>
      )}

      {/* Diff table */}
      {result && filteredRows.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      filteredRows
                        .filter((r) => r.status !== 'unchanged')
                        .every((r) => selected.has(r.modelId)) &&
                      filteredRows.some((r) => r.status !== 'unchanged')
                    }
                    onCheckedChange={() => toggleAll(filteredRows)}
                  />
                </TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Input / 1M tokens</TableHead>
                <TableHead>Output / 1M tokens</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow
                  key={row.modelId}
                  className={
                    row.status === 'unchanged' ? 'opacity-50' : undefined
                  }
                >
                  <TableCell>
                    {row.status !== 'unchanged' && (
                      <Checkbox
                        checked={selected.has(row.modelId)}
                        onCheckedChange={() => toggleSelect(row.modelId)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.modelId}
                  </TableCell>
                  <TableCell className="capitalize">{row.provider}</TableCell>
                  <TableCell>
                    {priceCell(row.currentInput, row.latestInput, row.status)}
                  </TableCell>
                  <TableCell>
                    {priceCell(row.currentOutput, row.latestOutput, row.status)}
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {result && filteredRows.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredRows.length} items)
            </p>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {generatePageNumbers(currentPage, totalPages).map((pageNum, i) =>
                pageNum === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {result && filteredRows.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No models match the current filter.
        </p>
      )}
    </div>
  );
}
