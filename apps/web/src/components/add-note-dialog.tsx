'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { createNote } from '@/lib/actions/notes';
import { ErrorState } from '@/lib/definitions';

export default function AddNoteDialog({
  topicId,
  trigger,
  onSuccess,
}: {
  topicId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const initialErrorState: ErrorState = { errors: {}, message: null };
  const [errorState, formAction, isPending] = useActionState(
    createNote,
    initialErrorState
  );

  // Keep a stable ref to onSuccess so the effect doesn't re-fire on callback identity changes
  const onSuccessRef = React.useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // Close popover and notify parent on successful creation
  React.useEffect(() => {
    if (
      errorState.message &&
      !errorState.errors?.title &&
      !errorState.errors?.description
    ) {
      setOpen(false);
      onSuccessRef.current?.();
    }
  }, [errorState]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="ghost" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New note
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start" sideOffset={8}>
        <form className="space-y-3" action={formAction}>
          <input type="hidden" name="topicId" value={topicId} />

          <p className="text-sm font-semibold">New note</p>

          <div className="space-y-2">
            <div className="space-y-1.5">
              <Label htmlFor="note-title" className="text-xs font-medium">
                Title
              </Label>
              <Input
                id="note-title"
                name="title"
                placeholder="e.g. Chapter 1 Notes"
                className="h-8 text-xs rounded-xl"
                aria-required="true"
              />
              {errorState.errors?.title && (
                <p className="text-destructive text-xs">
                  {errorState.errors.title[0]}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="note-description"
                className="text-xs font-medium"
              >
                Description
              </Label>
              <textarea
                id="note-description"
                name="description"
                placeholder="Describe the note..."
                rows={3}
                aria-required="true"
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errorState.errors?.description && (
                <p className="text-destructive text-xs">
                  {errorState.errors.description[0]}
                </p>
              )}
            </div>
          </div>

          {errorState.message &&
            (errorState.errors?.title || errorState.errors?.description) && (
              <p className="text-xs text-muted-foreground">
                {errorState.message}
              </p>
            )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1 h-7 rounded-xl text-xs"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="flex-1 h-7 rounded-xl text-xs"
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              )}
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
