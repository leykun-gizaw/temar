'use client';

import { useState, useTransition } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
  Label,
} from '@temar/ui';
import { Loader2 } from 'lucide-react';

interface EditDialogProps {
  entityType: 'topic' | 'note' | 'chunk';
  currentName: string;
  currentDescription: string;
  onSave: (name: string, description: string) => Promise<void>;
  trigger: React.ReactNode;
}

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
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="end" sideOffset={8}>
        <div className="space-y-3">
          <p className="text-sm font-semibold">
            Edit {entityType}
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs">
              Name
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-xs">
              Description
            </Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex min-h-[60px] w-full rounded-xl bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-xl text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 rounded-xl text-xs"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
