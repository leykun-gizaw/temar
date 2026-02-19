import AddTopicDialog from '@/app/dashboard/topics/_components/add-topic-dialog';
import { getFilteredTopics } from '@/lib/fetchers/topics';
import TopicCardWrapper from './topic-card-wrapper';
import { getTrackingStatus } from '@/lib/actions/tracking';
import { dbClient, chunk, note } from '@temar/db-client';
import { eq } from 'drizzle-orm';

export default async function GalleryList({
  query,
}: {
  query: string;
  type: string;
}) {
  const [notionTopics, trackedItems] = await Promise.all([
    getFilteredTopics(query),
    getTrackingStatus(),
  ]);

  const trackedChunkIds = new Set(trackedItems.map((t) => t.chunkId));

  // Compute per-topic tracking: a topic is tracked if all its chunks are tracked
  const topicTrackedMap = new Map<string, boolean>();
  for (const t of notionTopics) {
    const topicNotes = await dbClient
      .select({ id: note.id })
      .from(note)
      .where(eq(note.topicId, t.id));
    const allChunkIds: string[] = [];
    for (const n of topicNotes) {
      const chunks = await dbClient
        .select({ id: chunk.id })
        .from(chunk)
        .where(eq(chunk.noteId, n.id));
      allChunkIds.push(...chunks.map((c) => c.id));
    }
    topicTrackedMap.set(
      t.id,
      allChunkIds.length > 0 &&
        allChunkIds.every((id) => trackedChunkIds.has(id))
    );
  }

  return (
    <>
      {notionTopics.map((item) => (
        <TopicCardWrapper
          key={item.id}
          item={item}
          isTracked={topicTrackedMap.get(item.id) ?? false}
        />
      ))}
      <div className="border border-dashed rounded-xl flex flex-col h-[180px]">
        <div className="flex-1 text-xs text-muted-foreground whitespace-pre-wrap flex items-center justify-center">
          <AddTopicDialog
            trigger={
              <button className="text-sm text-muted-foreground font-normal w-full h-full cursor-pointer hover:bg-accent hover:rounded-xl">
                + New topic
              </button>
            }
          />
        </div>
      </div>
    </>
  );
}
