import { getTopicById } from '@/lib/fetchers/topics';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicId: string }>;
}): Promise<Metadata> {
  const { topicId } = await params;
  const topic = await getTopicById(topicId);
  if (!topic) {
    return {
      title: `Topic - Notes`,
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
