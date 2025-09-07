'import server-only';

import type { Topic } from '@/lib/topic-types';

// Fetch a topic by id from an external DB service. Configure TOPICS_API_BASE_URL.
// Example: https://api.example.com (the route should be /topics/:id)
export async function getTopicByIdServer(
  topicId: string
): Promise<Topic | null> {
  const base = process.env.TOPICS_API_BASE_URL;
  if (!base) return null;

  const url = `${base.replace(/\/$/, '')}/api/topics/${encodeURIComponent(
    topicId
  )}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000); // 2s safety timeout

  try {
    const res = await fetch(url, {
      // cache metadata for a minute to keep it snappy
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as Topic;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
