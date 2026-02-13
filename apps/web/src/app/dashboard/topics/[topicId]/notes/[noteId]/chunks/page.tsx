import * as React from 'react';
import { LayoutGridIcon, Text } from 'lucide-react';
import { getNoteById } from '@/lib/fetchers/notes';
import { getTopicById } from '@/lib/fetchers/topics';
import ChunksGalleryList from '@/app/dashboard/topics/[topicId]/notes/[noteId]/_components/chunks-gallery-list';
import Search from '@/app/dashboard/topics/_components/search';

export default async function NoteChunksPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string; noteId: string }>;
  searchParams?: Promise<{ query?: string }>;
}) {
  const { topicId, noteId } = await params;
  const queryParams = await searchParams;

  const query = queryParams?.query || '';

  const note = await getNoteById(noteId);
  const topic = await getTopicById(topicId);

  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <span className="text-6xl">📄</span>
        <h1 className="text-2xl font-semibold mb-4">{note?.name} Chunks</h1>
        {note?.description ? (
          <div className="flex items-center">
            <span className="flex items-center gap-2 text-sm text-muted-foreground mr-12">
              <Text size={16} /> Description
            </span>
            <span className="text-xs">{note.description}</span>
          </div>
        ) : null}
      </div>
      <hr />

      <div className="flex flex-col items-center justify-between *:w-full gap-2">
        <h1 className="text-lg font-bold bg-primary/10 p-2">
          {topic?.name} &gt; {note?.name} - Chunks
        </h1>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2 bg-muted py-2 px-3 rounded-full">
            <LayoutGridIcon size={16} />
            Chunks Gallery
          </span>

          <div className="flex gap-2 items-center max-w-sm w-full">
            <Search placeholder="Search..." />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <ChunksGalleryList query={query} noteId={noteId} topicId={topicId} />
      </div>
    </div>
  );
}
