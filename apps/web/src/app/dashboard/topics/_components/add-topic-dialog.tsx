'use client';

import { useState, useRef, useActionState } from 'react';
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
import { LibraryBig, Loader2 } from 'lucide-react';
import { createTopic } from '@/lib/actions/topics';
import { ErrorState } from '@/lib/definitions';

interface AddTopicDialogProps {
  trigger?: React.ReactNode;
}

export function AddTopicDialog({ trigger }: AddTopicDialogProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const initialErrorState: ErrorState = { errors: {}, message: null };
  const [errorState, formAction, isPending] = useActionState(
    createTopic,
    initialErrorState
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            ref={triggerRef}
            type="button"
            size={'sm'}
            variant={'outline'}
          >
            <LibraryBig /> New Topic
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-auto">
        <form className="flex flex-col h-full" action={formAction}>
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-2">
              <span className="text-5xl">📚</span>
              Add Topic
            </DialogTitle>
            <DialogDescription className="text-center">
              Create a new topic to track your learning.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-1 overflow-auto space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Advanced Graph Theory"
                aria-required="true"
              />
              {errorState.errors?.title && (
                <p className="text-destructive text-sm">
                  {errorState.errors.title[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the topic..."
                rows={4}
                aria-required="true"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errorState.errors?.description && (
                <p className="text-destructive text-sm">
                  {errorState.errors.description[0]}
                </p>
              )}
            </div>
          </div>

          {errorState.message && (
            <p className="text-sm text-muted-foreground pt-2">
              {errorState.message}
            </p>
          )}

          <DialogFooter className="pt-2">
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Creating...' : 'Create'}
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddTopicDialog;
