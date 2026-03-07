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
import { Loader2 } from 'lucide-react';
import { createTopic } from '@/lib/actions/topics';
import { ErrorState } from '@/lib/definitions';

export function AddTopicDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const initialErrorState: ErrorState = { errors: {}, message: null };
  const [errorState, formAction, isPending] = useActionState(
    createTopic,
    initialErrorState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">New topic</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form className="space-y-4" action={formAction}>
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-2">
              <span className="text-5xl">📚</span>
              Add Topic
            </DialogTitle>
            <DialogDescription className="text-center">
              Create a new topic to organize your notes and chunks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="topic-title">Title</Label>
              <Input
                id="topic-title"
                name="title"
                placeholder="e.g. Machine Learning Basics"
                aria-required="true"
              />
              {errorState.errors?.title && (
                <p className="text-destructive text-sm">
                  {errorState.errors.title[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-description">Description</Label>
              <textarea
                id="topic-description"
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
