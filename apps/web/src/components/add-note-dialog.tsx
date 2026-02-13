'use client';

import * as React from 'react';
import { useActionState } from 'react';
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
import { createNote } from '@/lib/actions/notes';
import { ErrorState } from '@/lib/definitions';

export default function AddNoteDialog({
  topicId,
  trigger,
}: {
  topicId: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const initialErrorState: ErrorState = { errors: {}, message: null };
  const [errorState, formAction] = useActionState(
    createNote,
    initialErrorState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">New note</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form className="space-y-4" action={formAction}>
          <input type="hidden" name="topicId" value={topicId} />
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-2">
              <span className="text-5xl">📗</span>
              Add Note
            </DialogTitle>
            <DialogDescription className="text-center">
              Create a new note for this topic
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                name="title"
                placeholder="e.g. Chapter 1 Notes"
                aria-required="true"
              />
              {errorState.errors?.title && (
                <p className="text-destructive text-sm">
                  {errorState.errors.title[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-description">Description</Label>
              <textarea
                id="note-description"
                name="description"
                placeholder="Describe the note..."
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
            <p className="text-sm text-muted-foreground">
              {errorState.message}
            </p>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
