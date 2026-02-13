import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGridIcon, Plus, Text } from 'lucide-react';
import { getTopicById } from '@/lib/fetchers/topics';
import NotesGalleryList from '@/app/dashboard/topics/[topicId]/_components/notes-gallery-list';
import Search from '@/app/dashboard/topics/_components/search';
import AddNoteDialog from '@/components/add-note-dialog';

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
