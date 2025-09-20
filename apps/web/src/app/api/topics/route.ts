import { TopicSchema } from '@/lib/zod-schemas/topic-schema';
import { NextResponse } from 'next/server';
import { getAllTopics, topics_data } from './data';

export async function GET(request: Request) {
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.toLowerCase() || '';

  const all = getAllTopics();
  const filteredTopics = query
    ? all.filter(
        (topic) =>
          topic.name.toLowerCase().includes(query) ||
          topic.description.toLowerCase().includes(query)
      )
    : all;

  return NextResponse.json(filteredTopics);
}

export async function POST(request: Request) {
  const newTopic = await request.json();
  const topicToAdd = {
    ...newTopic,
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  console.log(topicToAdd);
  const parsedResult = TopicSchema.safeParse(topicToAdd);
  if (!parsedResult.success) {
    return NextResponse.json(
      { error: 'Invalid topic data', issues: parsedResult.error.issues },
      { status: 400 }
    );
  }
  topics_data.push(topicToAdd);

  return NextResponse.json(topicToAdd);
}
