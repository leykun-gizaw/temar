'use server';

import { dbClient, topic } from '@temar/db-client';
import { getLoggedInUser } from './users';
import { eq, and } from 'drizzle-orm';

export async function getTopicsCount() {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return 'N/A';

  const count = await dbClient.$count(
    topic,
    eq(topic.userId, loggedInUser?.id)
  );

  return count;
}

export async function getFilteredTopics(query: string) {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return [];

  const data = await dbClient
    .select()
    .from(topic)
    .where(eq(topic.userId, loggedInUser?.id));

  const filteredData = data.filter((topic) =>
    topic.name.toLowerCase().includes(query.toLowerCase())
  );
  return filteredData;
}

export async function getTopicById(topicId: string) {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return null;

  return (
    await dbClient
      .select()
      .from(topic)
      .where(and(eq(topic.userId, loggedInUser.id), eq(topic.id, topicId)))
  )[0];
}
