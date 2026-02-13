'use server';

import { revalidatePath } from 'next/cache';
import { dbClient, topic, note } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq, and } from 'drizzle-orm';
import { syncServiceFetch } from '../sync-service';

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

  // Update in Notion
  await syncServiceFetch(`page/${topicId}/properties`, {
    method: 'PATCH',
    body: { name, description },
  });

  // Update in DB
  await dbClient
    .update(topic)
    .set({ name, description })
    .where(eq(topic.id, topicId));

  revalidatePath('/dashboard/topics');
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

  // Update in Notion
  await syncServiceFetch(`page/${noteId}/properties`, {
    method: 'PATCH',
    body: { name, description },
  });

  // Update in DB
  await dbClient
    .update(note)
    .set({ name, description })
    .where(eq(note.id, noteId));

  revalidatePath(`/dashboard/topics/${topicId}/notes`);
}
