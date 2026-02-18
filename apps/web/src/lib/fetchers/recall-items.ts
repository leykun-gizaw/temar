import { getLoggedInUser } from './users';
import { fsrsServiceFetch } from '../fsrs-service';

export interface RecallItemDue {
  id: string;
  chunkId: string;
  state: number;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview: string | null;
  chunkName: string;
  noteName: string;
  noteId: string;
  topicName: string;
  topicId: string;
}

export interface SchedulingPreview {
  recallItemId: string;
  options: {
    again: { rating: number; nextDue: string; nextState: number; scheduledDays: number };
    hard: { rating: number; nextDue: string; nextState: number; scheduledDays: number };
    good: { rating: number; nextDue: string; nextState: number; scheduledDays: number };
    easy: { rating: number; nextDue: string; nextState: number; scheduledDays: number };
  };
}

export interface ReviewLogEntry {
  id: string;
  recallItemId: string;
  userId: string;
  rating: number;
  state: number;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  durationMs: number | null;
  reviewedAt: string;
}

export async function getDueRecallItems(options?: {
  topicId?: string;
  noteId?: string;
  limit?: number;
}): Promise<RecallItemDue[]> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return [];

  const params = new URLSearchParams();
  if (options?.topicId) params.set('topicId', options.topicId);
  if (options?.noteId) params.set('noteId', options.noteId);
  if (options?.limit) params.set('limit', String(options.limit));

  const qs = params.toString();
  const path = qs ? `due?${qs}` : 'due';

  const result = await fsrsServiceFetch<{ items: RecallItemDue[]; count: number }>(
    path,
    { userId: loggedInUser.id }
  );

  return result?.items ?? [];
}

export async function getDueCount(): Promise<number> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return 0;

  const result = await fsrsServiceFetch<{ count: number }>('due/count', {
    userId: loggedInUser.id,
  });

  return result?.count ?? 0;
}

export async function getSchedulingPreview(
  recallItemId: string
): Promise<SchedulingPreview | null> {
  const result = await fsrsServiceFetch<SchedulingPreview>(
    `recall-items/${recallItemId}/preview`
  );
  return result ?? null;
}

export async function getReviewHistory(
  recallItemId: string
): Promise<ReviewLogEntry[]> {
  const result = await fsrsServiceFetch<ReviewLogEntry[]>(
    `recall-items/${recallItemId}/history`
  );
  return result ?? [];
}
