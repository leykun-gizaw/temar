import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ConnectNotionButton from './_components/connect-notion-button';
import MaterialsBrowser from './_components/materials-browser';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { getFilteredTopics } from '@/lib/fetchers/topics';
import { getTrackingStatus } from '@/lib/actions/tracking';
import { dbClient, chunk, note, eq } from '@temar/db-client';

export default async function MaterialsPage() {
  const currentUser = await getLoggedInUser();

  if (!currentUser?.notionPageId) {
    const authUrl = process.env.NOTION_AUTHORIZATION_URL || '';
    return (
      <div className="col-span-full flex lg:mt-80 justify-center h-full">
        <div className="shadow max-w-xl w-full h-fit border bg-muted/5 rounded-lg p-6 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              Connect your Notion workspace
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect to Notion to duplicate the Temar template and start
              syncing topics and notes to your workspace.
            </p>
          </div>
          <ConnectNotionButton
            authUrl={authUrl}
            trigger={
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Connect to Notion
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const [allTopics, trackedItems] = await Promise.all([
    getFilteredTopics(''),
    getTrackingStatus(),
  ]);

  const trackedChunkIds = new Set(trackedItems.map((t) => t.chunkId));

  // Compute per-topic tracking
  const topicTrackedMap: Record<string, boolean> = {};
  for (const t of allTopics) {
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
    topicTrackedMap[t.id] =
      allChunkIds.length > 0 &&
      allChunkIds.every((id) => trackedChunkIds.has(id));
  }

  const topics = allTopics.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));

  const serializedTracked = trackedItems.map((t) => ({
    chunkId: t.chunkId,
  }));

  return (
    <MaterialsBrowser
      topics={topics}
      trackedItems={serializedTracked}
      topicTrackedMap={topicTrackedMap}
    />
  );
}
