'use server';

import { revalidatePath } from 'next/cache';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { fsrsServiceFetch } from '../fsrs-service';

export async function trackTopic(topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const result = await fsrsServiceFetch(`track/topic/${topicId}`, {
    method: 'POST',
    userId: loggedInUser.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/topics');
  return result;
}

export async function trackNote(noteId: string, topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const result = await fsrsServiceFetch(`track/note/${noteId}`, {
    method: 'POST',
    userId: loggedInUser.id,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/topics/${topicId}/notes`);
  return result;
}

export async function trackChunk(
  chunkId: string,
  noteId: string,
  topicId: string
) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const result = await fsrsServiceFetch(`track/chunk/${chunkId}`, {
    method: 'POST',
    userId: loggedInUser.id,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/topics/${topicId}/notes/${noteId}`);
  return result;
}

export async function untrackTopic(topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const result = await fsrsServiceFetch(`track/topic/${topicId}`, {
    method: 'DELETE',
    userId: loggedInUser.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/topics');
  return result;
}

export async function untrackNote(noteId: string, topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const result = await fsrsServiceFetch(`track/note/${noteId}`, {
    method: 'DELETE',
    userId: loggedInUser.id,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/topics/${topicId}/notes`);
  return result;
}

export async function untrackChunk(
  chunkId: string,
  noteId: string,
  topicId: string
) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const result = await fsrsServiceFetch(`track/chunk/${chunkId}`, {
    method: 'DELETE',
    userId: loggedInUser.id,
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/topics/${topicId}/notes/${noteId}`);
  return result;
}

export async function getTrackingStatus() {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return [];

  const result = await fsrsServiceFetch<
    Array<{
      id: string;
      chunkId: string;
      state: number;
      due: string;
      reps: number;
    }>
  >('track/status', { userId: loggedInUser.id });

  return result ?? [];
}
