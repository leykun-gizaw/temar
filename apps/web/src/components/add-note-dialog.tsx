'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Note } from '@/lib/schemas/note-schema';

export default function AddNoteDialog({
  topicId,
  trigger,
}: {
  topicId: string;
  trigger?: React.ReactNode;
}) {
  const qc = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const notesKey = (id: string) => ['notes', { topicId: id }] as const;

  const createNote = useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      topicId: string;
    }) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMsg =
          data?.details?.formErrors?.[0] ??
          Object.values<string[] | undefined>(
            data?.details?.fieldErrors ?? {}
          )[0]?.[0] ??
          data?.error;
        throw new Error(serverMsg || `Request failed (${res.status})`);
      }
      return data as Note;
    },
    onMutate: async (payload) => {
      setError(null);
      await qc.cancelQueries({ queryKey: notesKey(payload.topicId) });

      const prev = qc.getQueryData<Note[]>(notesKey(payload.topicId)) || [];

      const now = new Date().toISOString();
      const optimistic: Note = {
        id: `optimistic-${now}`,
        title: payload.title,
        description: payload.description,
        topicId: payload.topicId,
        createdAt: now,
        updatedAt: now,
        // userId optional
      } as Note;

      qc.setQueryData<Note[]>(notesKey(payload.topicId), [optimistic, ...prev]);

      return { prev };
    },
    onError: (err, payload, ctx) => {
      if (ctx?.prev)
        qc.setQueryData<Note[]>(notesKey(payload.topicId), ctx.prev);
      setError(err instanceof Error ? err.message : 'Failed to create note');
    },
    onSuccess: (created, payload) => {
      qc.setQueryData<Note[]>(notesKey(payload.topicId), (curr) => {
        const list = curr ?? [];
        const withoutOptimistic = list.filter(
          (n) => !String(n.id).startsWith('optimistic-')
        );
        return [created, ...withoutOptimistic];
      });
      qc.invalidateQueries({ queryKey: ['notes'] });
      setOpen(false);
      setTitle('');
      setDescription('');
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    createNote.mutate({
      title: title.trim(),
      description: description.trim(),
      topicId,
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">New note</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New note</DialogTitle>
            <DialogDescription>Create a note for this topic.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write your note..."
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createNote.isPending}
              aria-disabled={createNote.isPending}
            >
              {createNote.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
