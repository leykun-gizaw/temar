'use server';

import { revalidatePath } from 'next/cache';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { fsrsServiceFetch } from '../fsrs-service';
import { getUserAiConfig } from './ai-settings';

async function getAiHeaders(): Promise<Record<string, string>> {
  const config = await getUserAiConfig();
  if (!config) return {};
  return {
    ...(config.provider && { 'x-ai-provider': config.provider }),
    ...(config.model && { 'x-ai-model': config.model }),
    ...(config.apiKey && { 'x-ai-api-key': config.apiKey }),
  };
}

export async function trackTopic(topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();
  const result = await fsrsServiceFetch(`track/topic/${topicId}`, {
    method: 'POST',
    userId: loggedInUser.id,
    headers: aiHeaders,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/topics');
  return result;
}

export async function trackNote(noteId: string, topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();
  const result = await fsrsServiceFetch(`track/note/${noteId}`, {
    method: 'POST',
    userId: loggedInUser.id,
    headers: aiHeaders,
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

  const aiHeaders = await getAiHeaders();
  const result = await fsrsServiceFetch(`track/chunk/${chunkId}`, {
    method: 'POST',
    userId: loggedInUser.id,
    headers: aiHeaders,
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

export interface TrackingItem {
  id: string;
  chunkId: string;
  status: 'pending' | 'generating' | 'ready' | 'failed' | 'untracked';
  errorMessage: string | null;
  retryCount: number;
  lastAttemptAt: string | null;
  createdAt: string;
  chunkName: string;
}

export async function getTrackingStatus(): Promise<TrackingItem[]> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return [];

  const result = await fsrsServiceFetch<TrackingItem[]>('track/status', {
    userId: loggedInUser.id,
  });

  return result ?? [];
}

export async function retryFailedGeneration(chunkId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();
  const result = await fsrsServiceFetch(`track/retry/${chunkId}`, {
    method: 'POST',
    userId: loggedInUser.id,
    headers: aiHeaders,
  });

  revalidatePath('/dashboard');
  return result;
}

export async function retryAllFailedGenerations() {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();
  const result = await fsrsServiceFetch('track/retry-all-failed', {
    method: 'POST',
    userId: loggedInUser.id,
    headers: aiHeaders,
  });

  revalidatePath('/dashboard');
  return result;
}

export interface OutdatedChunk {
  chunkId: string;
  chunkName: string;
  noteName: string;
  noteId: string;
  topicName: string;
  topicId: string;
  reason: 'retired' | 'content_changed';
  activeCount: number;
  retiredCount: number;
}

export async function getOutdatedChunks(): Promise<OutdatedChunk[]> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return [];

  const result = await fsrsServiceFetch<OutdatedChunk[]>('track/outdated', {
    userId: loggedInUser.id,
  });

  return result ?? [];
}

export async function regenerateChunkQuestions(chunkId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();
  const result = await fsrsServiceFetch(`track/regenerate/${chunkId}`, {
    method: 'POST',
    userId: loggedInUser.id,
    headers: aiHeaders,
  });

  revalidatePath('/dashboard');
  return result;
}

export interface UnderperformingChunk {
  chunkId: string;
  chunkName: string;
  noteName: string;
  noteId: string;
  topicName: string;
  topicId: string;
  itemCount: number;
  totalLapses: number;
  avgStability: number;
}

export async function getUnderperformingChunks(
  minLapses?: number,
  maxStability?: number
): Promise<UnderperformingChunk[]> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return [];

  const params = new URLSearchParams();
  if (minLapses !== undefined) params.set('minLapses', String(minLapses));
  if (maxStability !== undefined)
    params.set('maxStability', String(maxStability));

  const qs = params.toString();
  const result = await fsrsServiceFetch<UnderperformingChunk[]>(
    `track/underperforming${qs ? `?${qs}` : ''}`,
    { userId: loggedInUser.id }
  );

  return result ?? [];
}
