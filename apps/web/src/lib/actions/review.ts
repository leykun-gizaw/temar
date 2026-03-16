'use server';

import { revalidatePath } from 'next/cache';
import { fsrsServiceFetch } from '../fsrs-service';
import {
  searchRecallItems,
  getAllRecallItems,
  type RecallItemDue,
} from '../fetchers/recall-items';
import { dbClient, recallItem, eq, and, inArray } from '@temar/db-client';
import { getLoggedInUser } from '../fetchers/users';

export async function submitReview(
  recallItemId: string,
  rating: number,
  durationMs?: number,
  answerJson?: unknown,
  analysisJson?: unknown,
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
    body: { rating, durationMs, answerJson, analysisJson },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/reviews');
  return result;
}

export async function searchRecallItemsAction(
  query: string,
): Promise<RecallItemDue[]> {
  return searchRecallItems(query);
}

export async function getAllRecallItemsAction(
  limit: number,
  offset: number,
): Promise<{ items: RecallItemDue[]; total: number }> {
  return getAllRecallItems({ limit, offset });
}

export async function saveAnswerDraft(
  recallItemId: string,
  answerJson: unknown,
) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  await dbClient
    .update(recallItem)
    .set({ answerDraftJson: answerJson })
    .where(
      and(
        eq(recallItem.id, recallItemId),
        eq(recallItem.userId, loggedInUser.id),
      ),
    );
}

export async function getAnswerDrafts(
  recallItemIds: string[],
): Promise<Record<string, unknown>> {
  if (!recallItemIds.length) return {};

  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return {};

  const rows = await dbClient
    .select({
      id: recallItem.id,
      answerDraftJson: recallItem.answerDraftJson,
    })
    .from(recallItem)
    .where(
      and(
        inArray(recallItem.id, recallItemIds),
        eq(recallItem.userId, loggedInUser.id),
      ),
    );

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    if (row.answerDraftJson) {
      result[row.id] = row.answerDraftJson;
    }
  }
  return result;
}
