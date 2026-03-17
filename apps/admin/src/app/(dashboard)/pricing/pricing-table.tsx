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
import { updatePricing, fetchPricingHistory } from './actions';

interface PricingHistoryRow {
  id: string;
  modelId: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changeReason: string | null;
}

export function PricingTable({ models }: { models: ModelConfig[] }) {
  const [editModel, setEditModel] = useState<ModelConfig | null>(null);
  const [historyModel, setHistoryModel] = useState<string | null>(null);
  const [history, setHistory] = useState<PricingHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    const result = await updatePricing(formData);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Pricing updated');
      setEditModel(null);
    }
  }

  async function openHistory(modelId: string) {
    setHistoryModel(modelId);
    const rows = await fetchPricingHistory(modelId);
    setHistory(rows as PricingHistoryRow[]);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Input Price / 1M tokens</TableHead>
            <TableHead>Output Price / 1M tokens</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((m) => (
            <TableRow key={m.modelId}>
              <TableCell className="font-mono text-sm">{m.modelId}</TableCell>
              <TableCell className="capitalize">{m.provider}</TableCell>
              <TableCell>${m.inputPricePer1M.toFixed(4)}</TableCell>
              <TableCell>${m.outputPricePer1M.toFixed(4)}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModel(m)}
                >
                  Update Pricing
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
                No active models with pricing
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Update Pricing Dialog */}
      <Dialog open={!!editModel} onOpenChange={() => setEditModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Pricing — {editModel?.label}
            </DialogTitle>
          </DialogHeader>
          {editModel && (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="modelId" value={editModel.modelId} />
              <div className="space-y-2">
                <Label htmlFor="inputPrice">Input Price per 1M (USD)</Label>
                <Input
                  id="inputPrice"
                  name="inputPrice"
                  type="number"
                  step="0.0001"
                  min="0"
                  defaultValue={editModel.inputPricePer1M}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outputPrice">Output Price per 1M (USD)</Label>
                <Input
                  id="outputPrice"
                  name="outputPrice"
                  type="number"
                  step="0.0001"
                  min="0"
                  defaultValue={editModel.outputPricePer1M}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Change Reason</Label>
                <Textarea id="reason" name="reason" placeholder="Why is this changing?" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Pricing'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Pricing History Sheet */}
      <Sheet open={!!historyModel} onOpenChange={() => setHistoryModel(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Pricing History — {historyModel}</SheetTitle>
          </SheetHeader>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Input Price</TableHead>
                <TableHead>Output Price</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>${row.inputPricePer1M.toFixed(4)}</TableCell>
                  <TableCell>${row.outputPricePer1M.toFixed(4)}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(row.effectiveFrom).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.effectiveTo
                      ? new Date(row.effectiveTo).toLocaleDateString()
                      : 'Current'}
                  </TableCell>
                  <TableCell className="text-xs">{row.changeReason ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SheetContent>
      </Sheet>
    </>
  );
}
