'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { Topic } from '@/lib/topic-types';
import TopicTitleFromCache from '@/components/topic-title-from-cache';
import AddNoteDialog from '@/components/add-note-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGridIcon, Plus, Text } from 'lucide-react';

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
  const TopicTitle = (
    <TopicTitleFromCache topicId={topicId} fallback={fallbackTitle} />
  );

  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <span className="text-6xl">📗</span>
        <h1 className="text-2xl font-semibold mb-4">{TopicTitle} Notes</h1>
        {topic?.description ? (
          <div className="flex items-center">
            <span className="flex items-center gap-2 text-sm text-muted-foreground mr-12">
              <Text size={16} /> Description
            </span>
            <span className="text-xs">{topic.description}</span>
          </div>
        ) : null}
      </div>
      <hr />

      <div className="flex flex-col items-center justify-between *:w-full gap-2">
        <h1 className="text-lg font-bold bg-primary/10 p-2">
          {TopicTitle} - Notes
        </h1>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2 bg-muted py-2 px-3 rounded-full">
            <LayoutGridIcon size={16} />
            Notes Gallery
          </span>
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
          <div
            key={note.id}
            className="border rounded-xl flex flex-col hover:bg-accent h-[180px] cursor-pointer"
          >
            <div className="flex-1 border-b text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50">
              {excerpt(note.description)}
            </div>
            <div className="h-1/4 flex items-center pl-4">
              <span className="text-sm font-semibold">📘 {note.title}</span>
            </div>
          </div>
        ))}

        <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
          <div className="flex-1 text-xs text-muted-foreground whitespace-pre-wrap flex items-center justify-center">
            <AddNoteDialog
              topicId={topicId}
              trigger={
                <button className="text-sm text-muted-foreground font-normal w-full h-full cursor-pointer hover:bg-accent">
                  + New note
                </button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
