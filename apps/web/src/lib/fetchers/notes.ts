'use server';

import { dbClient, note } from '@temar/db-client';
import { getLoggedInUser } from './users';
import { eq, and } from 'drizzle-orm';

export async function getNotesCount() {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return 'N/A';

  const count = await dbClient.$count(note, eq(note.userId, loggedInUser.id));
  return count;
}

export async function getFilteredNotes(query: string, topicId: string) {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return [];

  const data = await dbClient
    .select()
    .from(note)
    .where(and(eq(note.userId, loggedInUser.id), eq(note.topicId, topicId)));

  const filteredData = data.filter((n) =>
    n.name.toLowerCase().includes(query.toLowerCase())
  );
  return filteredData;
}

export async function getNoteById(noteId: string) {
  const loggedInUser = await getLoggedInUser();

  if (!loggedInUser) return null;

  return (
    await dbClient
      .select()
      .from(note)
      .where(and(eq(note.userId, loggedInUser.id), eq(note.id, noteId)))
  )[0];
}
