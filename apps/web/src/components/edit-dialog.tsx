'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface EditDialogProps {
  entityType: 'topic' | 'note' | 'chunk';
  currentName: string;
  currentDescription: string;
  onSave: (name: string, description: string) => Promise<void>;
  trigger: React.ReactNode;
}

const emojiMap = { topic: '📚', note: '📗', chunk: '📄' } as const;

export default function EditDialog({
  entityType,
  currentName,
  currentDescription,
  onSave,
  trigger,
}: EditDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setName(currentName);
      setDescription(currentDescription);
      setError(null);
    }
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await onSave(name, description);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-col items-center gap-2">
            <span className="text-5xl">{emojiMap[entityType]}</span>
            Edit {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
          <DialogDescription className="text-center">
            Update the name and description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive pt-1">{error}</p>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
