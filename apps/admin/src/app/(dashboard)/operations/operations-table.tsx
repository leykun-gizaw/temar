'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { updateOperation } from './actions';

interface OpRow {
  operationType: string;
  label: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  isCurrentFeature: boolean;
  isActive: boolean;
  createdAt: Date | null;
}

export function OperationsTable({ operations }: { operations: OpRow[] }) {
  const [editOp, setEditOp] = useState<OpRow | null>(null);
  const [isCurrentFeature, setIsCurrentFeature] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  function openEdit(op: OpRow) {
    setEditOp(op);
    setIsCurrentFeature(op.isCurrentFeature);
    setIsActive(op.isActive);
  }

  async function handleUpdate(formData: FormData) {
    formData.set('isCurrentFeature', String(isCurrentFeature));
    formData.set('isActive', String(isActive));
    setLoading(true);
    const result = await updateOperation(formData);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Operation updated');
      setEditOp(null);
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operation Type</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Max Input Tokens</TableHead>
            <TableHead>Max Output Tokens</TableHead>
            <TableHead>Current Feature</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operations.map((op) => (
            <TableRow key={op.operationType}>
              <TableCell className="font-mono text-sm">
                {op.operationType}
              </TableCell>
              <TableCell>{op.label}</TableCell>
              <TableCell>{op.maxInputTokens.toLocaleString()}</TableCell>
              <TableCell>{op.maxOutputTokens.toLocaleString()}</TableCell>
              <TableCell>
                {op.isCurrentFeature ? (
                  <Badge>Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={op.isActive ? 'default' : 'secondary'}>
                  {op.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(op)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {operations.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No operations configured
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editOp} onOpenChange={() => setEditOp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Operation — {editOp?.operationType}</DialogTitle>
          </DialogHeader>
          {editOp && (
            <form action={handleUpdate} className="space-y-4">
              <input
                type="hidden"
                name="operationType"
                value={editOp.operationType}
              />
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  name="label"
                  defaultValue={editOp.label}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxInputTokens">Max Input Tokens</Label>
                <Input
                  id="maxInputTokens"
                  name="maxInputTokens"
                  type="number"
                  defaultValue={editOp.maxInputTokens}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxOutputTokens">Max Output Tokens</Label>
                <Input
                  id="maxOutputTokens"
                  name="maxOutputTokens"
                  type="number"
                  defaultValue={editOp.maxOutputTokens}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isCurrentFeature">Is Current Feature</Label>
                <Switch
                  id="isCurrentFeature"
                  checked={isCurrentFeature}
                  onCheckedChange={setIsCurrentFeature}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Is Active</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
