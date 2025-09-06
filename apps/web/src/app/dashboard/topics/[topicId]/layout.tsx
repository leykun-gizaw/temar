import type { Metadata } from 'next';
import type { Topic } from '@/lib/topic-types';

async function fetchTopicById(topicId: string): Promise<Topic | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_ORIGIN ?? ''}/api/topics`,
      {
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const topics = (await res.json()) as Topic[];
    return topics.find((t) => String(t.id) === String(topicId)) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { topicId: string };
}): Promise<Metadata> {
  const topic = await fetchTopicById(params.topicId);
  if (!topic) {
    return {
      title: `Topic ${params.topicId} — Notes`,
      description: 'The selected topic could not be found.',
    };
  }
  return { title: `${topic.name} — Notes`, description: topic.description };
}

export default function TopicNotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
