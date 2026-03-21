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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? <Button size="sm">New topic</Button>}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <form className="space-y-3" action={formAction}>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Add Topic</p>
            <p className="text-xs text-muted-foreground">
              Create a new topic to organize your notes
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="topic-title" className="text-xs">Title</Label>
              <Input
                id="topic-title"
                name="title"
                placeholder="e.g. Machine Learning Basics"
                className="h-8 text-sm"
                aria-required="true"
              />
              {errorState.errors?.title && (
                <p className="text-destructive text-xs">
                  {errorState.errors.title[0]}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic-description" className="text-xs">Description</Label>
              <textarea
                id="topic-description"
                name="description"
                placeholder="Describe the topic..."
                rows={3}
                aria-required="true"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errorState.errors?.description && (
                <p className="text-destructive text-xs">
                  {errorState.errors.description[0]}
                </p>
              )}
            </div>
          </div>

          {errorState.message && (
            <p className="text-xs text-muted-foreground">
              {errorState.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs" disabled={isPending}>
              {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
