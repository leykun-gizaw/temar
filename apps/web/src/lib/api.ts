import { Topic } from './topic-types';

export async function getTopics(query: string | undefined): Promise<Topic[]> {
  const queryString = query ? `?query=${encodeURIComponent(query)}` : '';
  const res = await fetch(`http://localhost:3000/api/topics${queryString}`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch topics');
  }
  return res.json();
}
