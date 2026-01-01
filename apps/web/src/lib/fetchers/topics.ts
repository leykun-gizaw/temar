'use server';

import { dbClient, topic } from '@temar/db-client';
import { getLoggedInUser } from './users';
import { eq } from 'drizzle-orm';

export async function getFilteredDBTopics(pageId: string, query: string) {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return [];

  const dataOriginal = await dbClient
    .select()
    .from(topic)
    .where(eq(topic.userId, loggedInUser?.id));

  const filteredDataOriginal = dataOriginal.filter((topic) =>
    topic.name.toLowerCase().includes(query.toLowerCase())
  );
  console.log('It workes');
  return filteredDataOriginal;
}
