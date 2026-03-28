'use client';

import { useMemo, useState } from 'react';
import type { ModelConfig } from '@temar/shared-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Input,
  Label,
  Textarea,
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
import { toast } from 'sonner';
import { updateMarkupAction, fetchMarkupHistory } from './actions';

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

interface MarkupHistoryRow {
  id: string;
  modelId: string;
  markupFactor: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changeReason: string | null;
}

function computeCostPreviewUsd(
  inputPricePer1M: number,
  outputPricePer1M: number,
  markupFactor: number
): number {
  const inputCost = (4000 / 1_000_000) * inputPricePer1M;
  const outputCost = (2000 / 1_000_000) * outputPricePer1M;
  return (inputCost + outputCost) * markupFactor;
}

interface MarkupTableProps {
  models: ModelConfig[];
  costTiers: Record<string, string>;
  rawCosts: Record<string, number>;
}

export function MarkupTable({ models, costTiers, rawCosts }: MarkupTableProps) {
  const [editModel, setEditModel] = useState<ModelConfig | null>(null);
  const [previewFactor, setPreviewFactor] = useState(1.0);
  const [historyModel, setHistoryModel] = useState<string | null>(null);
  const [history, setHistory] = useState<MarkupHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const providerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of models) {
      counts.set(m.provider, (counts.get(m.provider) ?? 0) + 1);
    }
    return counts;
  }, [models]);

  const tierCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of models) {
      const tier = costTiers[m.modelId] ?? '—';
      counts.set(tier, (counts.get(tier) ?? 0) + 1);
    }
    return counts;
  }, [models, costTiers]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (providerFilter && m.provider !== providerFilter) return false;
      if (tierFilter && (costTiers[m.modelId] ?? '—') !== tierFilter) return false;
      return true;
    });
  }, [models, costTiers, providerFilter, tierFilter]);

  const totalPages = Math.ceil(filteredModels.length / pageSize);

  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredModels.slice(start, start + pageSize);
  }, [filteredModels, currentPage, pageSize]);

  function openEdit(model: ModelConfig) {
    setEditModel(model);
    setPreviewFactor(model.markupFactor);
  }

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    const result = await updateMarkupAction(formData);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Markup updated');
      setEditModel(null);
    }
  }

  async function openHistory(modelId: string) {
    setHistoryModel(modelId);
    const rows = await fetchMarkupHistory(modelId);
    setHistory(rows as MarkupHistoryRow[]);
  }

  return (
    <>
      <div className="space-y-2 mb-4">
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={providerFilter === null ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => { setProviderFilter(null); setCurrentPage(1); }}
          >
            All ({models.length})
          </Button>
          {[...providerCounts.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([provider, count]) => (
              <Button
                key={provider}
                variant={providerFilter === provider ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => { setProviderFilter(provider); setCurrentPage(1); }}
              >
                <span className="capitalize">{provider}</span> ({count})
              </Button>
            ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={tierFilter === null ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => { setTierFilter(null); setCurrentPage(1); }}
          >
            All ({models.length})
          </Button>
          {[...tierCounts.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([tier, count]) => (
              <Button
                key={tier}
                variant={tierFilter === tier ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => { setTierFilter(tier); setCurrentPage(1); }}
              >
                {tier} ({count})
              </Button>
            ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Current Markup Factor</TableHead>
            <TableHead>Effective Cost Tier</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedModels.map((m) => (
            <TableRow key={m.modelId}>
              <TableCell className="font-mono text-sm">{m.modelId}</TableCell>
              <TableCell className="capitalize">{m.provider}</TableCell>
              <TableCell>{m.markupFactor.toFixed(2)}x</TableCell>
              <TableCell>{costTiers[m.modelId] ?? '—'}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                  Update Markup
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openHistory(m.modelId)}
                >
                  View History
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {paginatedModels.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No active models
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {filteredModels.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredModels.length} items)
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

      {/* Update Markup Dialog */}
      <Dialog open={!!editModel} onOpenChange={() => setEditModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Markup — {editModel?.label}</DialogTitle>
          </DialogHeader>
          {editModel && (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="modelId" value={editModel.modelId} />

              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                <p>
                  <strong>Raw cost per request:</strong> $
                  {(rawCosts[editModel.modelId] ?? 0).toFixed(6)}
                </p>
                <p>
                  <strong>Cost tier:</strong>{' '}
                  {costTiers[editModel.modelId] ?? '—'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="markupFactor">Markup Factor</Label>
                <Input
                  id="markupFactor"
                  name="markupFactor"
                  type="number"
                  step="0.05"
                  min="1.0"
                  value={previewFactor}
                  onChange={(e) =>
                    setPreviewFactor(parseFloat(e.target.value) || 1.0)
                  }
                  required
                />
              </div>

              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                <strong>Cost per request preview:</strong> $
                {computeCostPreviewUsd(
                  editModel.inputPricePer1M,
                  editModel.outputPricePer1M,
                  previewFactor
                ).toFixed(6)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Change Reason</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Why is this changing?"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Markup'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Markup History Sheet */}
      <Sheet open={!!historyModel} onOpenChange={() => setHistoryModel(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Markup History — {historyModel}</SheetTitle>
          </SheetHeader>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Markup Factor</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.markupFactor.toFixed(2)}x</TableCell>
                  <TableCell className="text-xs">
                    {new Date(row.effectiveFrom).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.effectiveTo
                      ? new Date(row.effectiveTo).toLocaleDateString()
                      : 'Current'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.changeReason ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SheetContent>
      </Sheet>
    </>
  );
}
