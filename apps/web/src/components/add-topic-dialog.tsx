'use client';

import { useState, useRef } from 'react';
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
import { BookPlusIcon, LibraryBig } from 'lucide-react';
import { TopicInputSchema } from '@/lib/schemas/topic-schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function createTopic(input: { name: string; description: string }) {
  const res = await fetch('/api/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name.trim(),
      description: input.description.trim(),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

interface AddTopicDialogProps {
  queryKeyBase?: string[]; // override base key if needed, defaults to ['topics']
}

export function AddTopicDialog({
  queryKeyBase = ['topics'],
}: AddTopicDialogProps) {
  const qc = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'name' | 'description', string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      // Invalidate all topic queries (broad) so filtered queries refresh too
      qc.invalidateQueries({ queryKey: queryKeyBase, exact: false });
      reset();
      setOpen(false);
      setTimeout(() => triggerRef.current?.focus(), 0);
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add topic';
      setFormError(errorMessage);
    },
  });

  const validate = (partial?: boolean) => {
    const result = TopicInputSchema.safeParse({ name, description });
    if (result.success) {
      setFieldErrors({});
      if (!partial) setFormError(null);
      return true;
    }
    const errs: Partial<Record<'name' | 'description', string>> = {};
    for (const issue of result.error.issues) {
      const path = issue.path[0];
      if ((path === 'name' || path === 'description') && !errs[path]) {
        errs[path] = issue.message;
      }
    }
    setFieldErrors(errs);
    if (!partial) setFormError('Please fix the highlighted fields.');
    return false;
  };

  const reset = () => {
    setName('');
    setDescription('');
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate(false)) return;
    mutation.mutate({ name, description });
  };

  const handleBlur = () => validate(true);

  const loading = mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button ref={triggerRef} type="button" size={'sm'} variant="outline">
          <LibraryBig /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-auto">
        <form
          className="flex flex-col h-full"
          onSubmit={handleSubmit}
          noValidate
        >
          <DialogHeader>
            <DialogTitle>Add Topic</DialogTitle>
            <DialogDescription>
              Create a new topic to track your learning.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-1 overflow-auto space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlur}
                placeholder="e.g. Advanced Graph Theory"
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.name || undefined}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                disabled={loading}
              />
              {fieldErrors.name && (
                <p
                  id="name-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleBlur}
                placeholder="Describe the topic..."
                rows={4}
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.description || undefined}
                aria-describedby={
                  fieldErrors.description ? 'description-error' : undefined
                }
                disabled={loading}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {fieldErrors.description && (
                <p
                  id="description-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.description}
                </p>
              )}
            </div>
            {(formError || mutation.isError) && (
              <div
                className="text-sm text-destructive text-center"
                role="alert"
              >
                {formError}
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading || !name.trim() || !description.trim()}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                  disabled={loading}
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
