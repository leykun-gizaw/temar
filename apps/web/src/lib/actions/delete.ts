'use server';

import { revalidatePath } from 'next/cache';
import { dbClient, topic, note, chunk } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq, and } from 'drizzle-orm';
import { syncServiceFetch } from '../sync-service';

export async function deleteTopic(topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  // Verify ownership
  const [existing] = await dbClient
    .select({ id: topic.id })
    .from(topic)
    .where(and(eq(topic.id, topicId), eq(topic.userId, loggedInUser.id)));

  if (!existing) throw new Error('Topic not found');

  // Cascade-archive in Notion (archives topic + all child notes + chunks)
  await syncServiceFetch(`page/${topicId}/cascade`, {
    method: 'DELETE',
    userId: loggedInUser.id,
  });

  // Delete from DB (ON DELETE CASCADE handles notes + chunks)
  await dbClient.delete(topic).where(eq(topic.id, topicId));

  revalidatePath('/dashboard/topics');
}

export async function deleteNote(noteId: string, topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const [existing] = await dbClient
    .select({ id: note.id })
    .from(note)
    .where(and(eq(note.id, noteId), eq(note.userId, loggedInUser.id)));

  if (!existing) throw new Error('Note not found');

  // Cascade-archive in Notion (archives note + all child chunks)
  await syncServiceFetch(`page/${noteId}/cascade`, {
    method: 'DELETE',
    userId: loggedInUser.id,
  });

  // Delete from DB (ON DELETE CASCADE handles chunks)
  await dbClient.delete(note).where(eq(note.id, noteId));

  revalidatePath(`/dashboard/topics/${topicId}/notes`);
}

export async function deleteChunk(
  chunkId: string,
  noteId: string,
  topicId: string
) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const [existing] = await dbClient
    .select({ id: chunk.id })
    .from(chunk)
    .where(and(eq(chunk.id, chunkId), eq(chunk.userId, loggedInUser.id)));

  if (!existing) throw new Error('Chunk not found');

  // Archive single page in Notion
  await syncServiceFetch(`page/${chunkId}`, {
    method: 'DELETE',
    userId: loggedInUser.id,
  });

  // Delete from DB
  await dbClient.delete(chunk).where(eq(chunk.id, chunkId));

  revalidatePath(`/dashboard/topics/${topicId}/notes/${noteId}/chunks`);
}
