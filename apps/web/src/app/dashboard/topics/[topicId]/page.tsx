'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { Topic } from '@/lib/topic-types';
import TopicTitleFromCache from '@/components/topic-title-from-cache';
import AddNoteDialog from '@/components/add-note-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type Note = {
  id: string;
  title: string;
  content?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  userId?: string;
};

async function fetchNotesByTopicIdClient(topicId: string): Promise<Note[]> {
  const res = await fetch(`/api/notes?topicId=${encodeURIComponent(topicId)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return (await res.json()) as Note[];
}

async function fetchTopicByIdClient(topicId: string): Promise<Topic | null> {
  // Temporary: fetch all topics and find one (swap to /api/topics/[id] later)
  const res = await fetch('/api/topics', { cache: 'no-store' });
  if (!res.ok) return null;
  const topics = (await res.json()) as Topic[];
  return topics.find((t) => String(t.id) === String(topicId)) ?? null;
}

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default function TopicNotesPage() {
  const params = useParams();
  const topicId = String((params as { topicId: string }).topicId);

  const {
    data: notes = [],
    isLoading: notesLoading,
    isError: notesError,
  } = useQuery({
    queryKey: ['notes', { topicId }],
    queryFn: () => fetchNotesByTopicIdClient(topicId),
  });

  const { data: topic } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => fetchTopicByIdClient(topicId),
    staleTime: 30_000,
  });

  const fallbackTitle = topic?.name ?? `Topic ${topicId}`;

  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">
          <TopicTitleFromCache topicId={topicId} fallback={fallbackTitle} />
        </h1>
        {topic?.description ? (
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Gallery</div>
        <AddNoteDialog
          topicId={topicId}
          trigger={
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New
            </Button>
          }
        />
      </div>

      {notesLoading ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading notes…
          </CardContent>
        </Card>
      ) : notesError ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load notes.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="group cursor-default transition-shadow hover:shadow-sm"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{note.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {excerpt(note.content ?? note.description ?? '')}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed shadow-none cursor-pointer hover:bg-accent">
          <CardContent className="flex h-full min-h-[120px] items-center justify-center p-4">
            <AddNoteDialog
              topicId={topicId}
              trigger={
                <button className="text-sm text-muted-foreground underline underline-offset-4">
                  + New note
                </button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
