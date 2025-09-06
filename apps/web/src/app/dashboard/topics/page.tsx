import type { Topic } from '@/lib/topic-types';
import { Button } from '@/components/ui/button';
import AddNoteDialog from '@/components/add-note-dialog';
import { Plus } from 'lucide-react';
import TopicTitleFromCache from '@/components/topic-title-from-cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define a minimal Note type for rendering.
// Adjust fields to match your backend response.
type Note = {
  id: string;
  title: string;
  // allow either shape while you migrate
  content?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  userId?: string;
};

async function fetchNotesByTopicId(topicId: string): Promise<Note[]> {
  try {
    const res = await fetch(
      `/api/notes?topicId=${encodeURIComponent(topicId)}`,
      {
        cache: 'no-store',
        next: { tags: [`notes:topic:${topicId}`] },
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as Note[];
  } catch {
    return [];
  }
}

async function fetchTopicById(topicId: string): Promise<Topic | null> {
  try {
    // Still using the collection until /api/topics/[id] exists
    const res = await fetch(`/api/topics`, {
      cache: 'no-store',
      next: { tags: ['topics'] },
    });
    if (!res.ok) return null;
    const topics = (await res.json()) as Topic[];
    return topics.find((t) => String(t.id) === String(topicId)) ?? null;
  } catch {
    return null;
  }
}

function excerpt(value: unknown, max = 140) {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string; topicName?: string }>;
}) {
  const { topicId, topicName } = await searchParams;

  if (!topicId) {
    return (
      <div className="h-full p-6 space-y-4">
        <h1 className="text-3xl font-semibold">Topic Notes</h1>
        <Card>
          <CardHeader>
            <CardTitle>Select a topic</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Choose a topic from the sidebar to view and add notes.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [topic, notes] = await Promise.all([
    fetchTopicById(topicId),
    fetchNotesByTopicId(topicId),
  ]);

  const pageTitle = topic?.name ?? topicName ?? 'Topic';

  return (
    <div className="h-full p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">
          <TopicTitleFromCache topicId={topicId} fallback={pageTitle} />
        </h1>
        {topic?.description ? (
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        ) : null}
      </div>

      {/* "Gallery" toolbar */}
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

      {/* Notes grid */}
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

        {/* New note card (empty slot like Notion) */}
        <Card className="border-dashed">
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string; topicName?: string }>;
}) {
  const { topicId, topicName } = await searchParams;

  if (!topicId) {
    return {
      title: 'Topics',
      description: 'Select a topic to view its notes.',
    };
  }

  const topic = await fetchTopicById(topicId);

  if (!topic) {
    return {
      title: `${topicName ?? 'Topic'} — Notes`,
      description: 'The selected topic could not be found.',
    };
  }

  return {
    title: `${topic.name} — Notes`,
    description: topic.description,
  };
}
