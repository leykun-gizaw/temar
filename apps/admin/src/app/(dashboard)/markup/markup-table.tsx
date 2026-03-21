'use client';

import { useState } from 'react';
import type { ModelConfig } from '@temar/shared-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateMarkupAction, fetchMarkupHistory } from './actions';

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
          {models.map((m) => (
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
          {models.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No active models
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
