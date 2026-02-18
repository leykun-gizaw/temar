'use server';

import { revalidatePath } from 'next/cache';
import { fsrsServiceFetch } from '../fsrs-service';

export async function submitReview(
  recallItemId: string,
  rating: number,
  durationMs?: number
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
    body: { rating, durationMs },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/reviews');
  return result;
}
