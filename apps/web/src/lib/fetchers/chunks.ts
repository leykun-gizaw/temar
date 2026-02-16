'use server';

import { dbClient, chunk } from '@temar/db-client';
import { getLoggedInUser } from './users';
import { eq, and } from 'drizzle-orm';

export async function getChunksCount() {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return 'N/A';

  const count = await dbClient.$count(chunk, eq(chunk.userId, loggedInUser.id));

  return count;
}

export async function getFilteredChunks(query: string, noteId: string) {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return [];

  const data = await dbClient
    .select()
    .from(chunk)
    .where(and(eq(chunk.userId, loggedInUser.id), eq(chunk.noteId, noteId)));

  const filteredData = data.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
  return filteredData;
}

export async function getChunkById(chunkId: string) {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return null;

  return (
    await dbClient
      .select()
      .from(chunk)
      .where(and(eq(chunk.userId, loggedInUser.id), eq(chunk.id, chunkId)))
  )[0];
}
