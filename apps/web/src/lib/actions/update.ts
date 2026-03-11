'use server';

import { revalidatePath } from 'next/cache';
import { dbClient, topic, note, chunk, eq, and } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';

export async function updateTopic(
  topicId: string,
  name: string,
  description: string
) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const [existing] = await dbClient
    .select({ id: topic.id })
    .from(topic)
    .where(and(eq(topic.id, topicId), eq(topic.userId, loggedInUser.id)));

  if (!existing) throw new Error('Topic not found');

  await dbClient
    .update(topic)
    .set({ name, description })
    .where(eq(topic.id, topicId));

  revalidatePath('/dashboard/materials');
}

export async function updateNote(
  noteId: string,
  topicId: string,
  name: string,
  description: string
) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const [existing] = await dbClient
    .select({ id: note.id })
    .from(note)
    .where(and(eq(note.id, noteId), eq(note.userId, loggedInUser.id)));

  if (!existing) throw new Error('Note not found');

  await dbClient
    .update(note)
    .set({ name, description })
    .where(eq(note.id, noteId));

  revalidatePath('/dashboard/materials');
}

export async function updateChunk(
  chunkId: string,
  noteId: string,
  topicId: string,
  name: string,
  description: string
) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const [existing] = await dbClient
    .select({ id: chunk.id })
    .from(chunk)
    .where(and(eq(chunk.id, chunkId), eq(chunk.userId, loggedInUser.id)));

  if (!existing) throw new Error('Chunk not found');

  await dbClient
    .update(chunk)
    .set({ name, description })
    .where(eq(chunk.id, chunkId));

  revalidatePath('/dashboard/materials');
}
