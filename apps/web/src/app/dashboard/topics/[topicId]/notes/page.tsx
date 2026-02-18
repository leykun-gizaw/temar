import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGridIcon, Plus, Text } from 'lucide-react';
import { getTopicById } from '@/lib/fetchers/topics';
import NotesGalleryList from '@/app/dashboard/topics/[topicId]/_components/notes-gallery-list';
import Search from '@/app/dashboard/topics/_components/search';
import AddNoteDialog from '@/components/add-note-dialog';
import TrackingButton from '@/components/tracking-button';
import { getTrackingStatus } from '@/lib/actions/tracking';
import { dbClient, chunk, note } from '@temar/db-client';
import { eq } from 'drizzle-orm';

export default async function TopicNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams?: Promise<{ query?: string }>;
}) {
  const { topicId } = await params;
  const queryParams = await searchParams;

  const query = queryParams?.query || '';

  const topic = await getTopicById(topicId);
  const TopicTitle = topic?.name;

  const trackedItems = await getTrackingStatus();
  const trackedChunkIds = new Set(trackedItems.map((t) => t.chunkId));

  const topicNotes = await dbClient
    .select({ id: note.id })
    .from(note)
    .where(eq(note.topicId, topicId));
  const topicChunks = [];
  for (const n of topicNotes) {
    const chunks = await dbClient
      .select({ id: chunk.id })
      .from(chunk)
      .where(eq(chunk.noteId, n.id));
    topicChunks.push(...chunks);
  }
  const isTopicTracked =
    topicChunks.length > 0 &&
    topicChunks.every((c) => trackedChunkIds.has(c.id));

  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-6xl">📗</span>
          <TrackingButton
            entityType="topic"
            entityId={topicId}
            isTracked={isTopicTracked}
          />
        </div>
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

          <div className="flex gap-2 items-center max-w-sm w-full">
            <Search placeholder="Search..." />
            <AddNoteDialog
              topicId={topicId}
              trigger={
                <Button size="sm" className="">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <NotesGalleryList query={query} type="Note" topicId={topicId} />
      </div>
    </div>
  );
}
