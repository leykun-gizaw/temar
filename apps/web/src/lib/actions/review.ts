'use server';

import { revalidatePath } from 'next/cache';
import { fsrsServiceFetch } from '../fsrs-service';
import {
  searchRecallItems,
  getAllRecallItems,
  type RecallItemDue,
} from '../fetchers/recall-items';

export async function submitReview(
  recallItemId: string,
  rating: number,
  durationMs?: number,
  answerJson?: unknown
) {
  const result = await fsrsServiceFetch<{
    recallItemId: string;
    rating: number;
    nextState: number;
    nextDue: string;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
  }>(`recall-items/${recallItemId}/review`, {
    method: 'POST',
    body: { rating, durationMs, answerJson },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/reviews');
  return result;
}

export async function searchRecallItemsAction(
  query: string
): Promise<RecallItemDue[]> {
  return searchRecallItems(query);
}

export async function getAllRecallItemsAction(
  limit: number,
  offset: number
): Promise<{ items: RecallItemDue[]; total: number }> {
  return getAllRecallItems({ limit, offset });
}
