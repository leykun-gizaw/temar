'use server';

import { revalidatePath } from 'next/cache';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { fsrsServiceFetch } from '../fsrs-service';
import { getUserAiConfig, getAiSettings } from './ai-settings';
import { checkPassAvailability } from './pass';
import { dbClient, chunk, eq } from '@temar/db-client';
import type { AiProvider } from '@/lib/config/ai-operations';
import { DEFAULT_MODEL_ID } from '@/lib/config/ai-operations';

export type TrackResult<T = unknown> =
  | { status: 'success'; data: T; newBalance?: number }
  | { status: 'error'; message: string }
  | { status: 'insufficient_pass'; balance: number; required: number }
  | {
      status: 'consent_required';
      estimatedPassCost: number;
      basePassCost: number;
    };

async function getAiHeaders(): Promise<Record<string, string>> {
  const config = await getUserAiConfig();
  const settings = await getAiSettings();
  const isByok = settings.useByok && settings.hasApiKey;
  return {
    ...(config?.provider && { 'x-ai-provider': config.provider }),
    ...(config?.model && { 'x-ai-model': config.model }),
    ...(config?.apiKey && { 'x-ai-api-key': config.apiKey }),
    'x-byok': isByok ? 'true' : 'false',
  };
}

async function passCheckForGeneration(
  inputText: string,
  consentedPassCost?: number
): Promise<
  { ok: true; passToDeduct: number } | { ok: false; result: TrackResult }
> {
  const aiConfig = await getUserAiConfig();
  const provider = (aiConfig?.provider ?? 'google') as AiProvider;
  const modelId = aiConfig?.model ?? DEFAULT_MODEL_ID;

  const passResult = await checkPassAvailability(
    'question_generation',
    modelId,
    inputText,
    provider,
    consentedPassCost
  );

  if (passResult.status === 'ok') {
    return { ok: true, passToDeduct: passResult.passToDeduct };
  }
  return { ok: false, result: passResult as TrackResult };
}

export async function trackTopic(
  topicId: string,
  questionTypes?: string[],
  questionCount?: number,
  consentedPassCost?: number
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const passCheck = await passCheckForGeneration('', consentedPassCost);
  if (!passCheck.ok) return passCheck.result;

  const aiHeaders = await getAiHeaders();
  const body: Record<string, unknown> = {};
  if (questionTypes?.length) body.questionTypes = questionTypes;
  if (questionCount != null) body.questionCount = questionCount;

  try {
    const data = await fsrsServiceFetch<Record<string, unknown>>(
      `track/topic/${topicId}`,
      {
        method: 'POST',
        userId: loggedInUser.id,
        headers: aiHeaders,
        ...(Object.keys(body).length > 0 && { body }),
      }
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/materials');
    return {
      status: 'success',
      data,
      ...(data?.newBalance != null && {
        newBalance: data.newBalance as number,
      }),
    };
  } catch (err) {
    return {
      status: 'error',
      message:
        err instanceof Error ? err.message : 'Question generation failed',
    };
  }
}

export async function trackNote(
  noteId: string,
  topicId: string,
  questionTypes?: string[],
  questionCount?: number,
  consentedPassCost?: number
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const passCheck = await passCheckForGeneration('', consentedPassCost);
  if (!passCheck.ok) return passCheck.result;

  const aiHeaders = await getAiHeaders();
  const body: Record<string, unknown> = {};
  if (questionTypes?.length) body.questionTypes = questionTypes;
  if (questionCount != null) body.questionCount = questionCount;

  try {
    const data = await fsrsServiceFetch<Record<string, unknown>>(
      `track/note/${noteId}`,
      {
        method: 'POST',
        userId: loggedInUser.id,
        headers: aiHeaders,
        ...(Object.keys(body).length > 0 && { body }),
      }
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/materials');
    return {
      status: 'success',
      data,
      ...(data?.newBalance != null && {
        newBalance: data.newBalance as number,
      }),
    };
  } catch (err) {
    return {
      status: 'error',
      message:
        err instanceof Error ? err.message : 'Question generation failed',
    };
  }
}

export async function trackChunk(
  chunkId: string,
  noteId: string,
  topicId: string,
  questionTypes?: string[],
  questionCount?: number,
  consentedPassCost?: number
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const [chunkRow] = await dbClient
    .select({ contentMd: chunk.contentMd })
    .from(chunk)
    .where(eq(chunk.id, chunkId))
    .limit(1);
  const inputText = chunkRow?.contentMd ?? '';

  const passCheck = await passCheckForGeneration(inputText, consentedPassCost);
  if (!passCheck.ok) return passCheck.result;

  const aiHeaders = await getAiHeaders();
  const body: Record<string, unknown> = {};
  if (questionTypes?.length) body.questionTypes = questionTypes;
  if (questionCount != null) body.questionCount = questionCount;

  try {
    const data = await fsrsServiceFetch<Record<string, unknown>>(
      `track/chunk/${chunkId}`,
      {
        method: 'POST',
        userId: loggedInUser.id,
        headers: aiHeaders,
        ...(Object.keys(body).length > 0 && { body }),
      }
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/materials');
    return {
      status: 'success',
      data,
      ...(data?.newBalance != null && {
        newBalance: data.newBalance as number,
      }),
    };
  } catch (err) {
    return {
      status: 'error',
      message:
        err instanceof Error ? err.message : 'Question generation failed',
    };
  }
}

export async function untrackTopic(topicId: string) {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const result = await fsrsServiceFetch(`track/topic/${topicId}`, {
    method: 'DELETE',
    userId: loggedInUser.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/materials');
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
  revalidatePath('/dashboard/materials');
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
  revalidatePath('/dashboard/materials');
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

export async function retryFailedGeneration(
  chunkId: string
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();

  try {
    const data = await fsrsServiceFetch(`track/retry/${chunkId}`, {
      method: 'POST',
      userId: loggedInUser.id,
      headers: aiHeaders,
    });

    revalidatePath('/dashboard');
    return { status: 'success', data };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Retry failed',
    };
  }
}

export async function retryAllFailedGenerations(): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const aiHeaders = await getAiHeaders();

  try {
    const data = await fsrsServiceFetch('track/retry-all-failed', {
      method: 'POST',
      userId: loggedInUser.id,
      headers: aiHeaders,
    });

    revalidatePath('/dashboard');
    return { status: 'success', data };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Retry all failed',
    };
  }
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

export async function regenerateChunkQuestions(
  chunkId: string,
  consentedPassCost?: number
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const [chunkRow] = await dbClient
    .select({ contentMd: chunk.contentMd })
    .from(chunk)
    .where(eq(chunk.id, chunkId))
    .limit(1);
  const inputText = chunkRow?.contentMd ?? '';

  const passCheck = await passCheckForGeneration(inputText, consentedPassCost);
  if (!passCheck.ok) return passCheck.result;

  const aiHeaders = await getAiHeaders();

  try {
    const data = await fsrsServiceFetch<Record<string, unknown>>(
      `track/regenerate/${chunkId}`,
      {
        method: 'POST',
        userId: loggedInUser.id,
        headers: aiHeaders,
      }
    );

    revalidatePath('/dashboard');
    return {
      status: 'success',
      data,
      ...(data?.newBalance != null && {
        newBalance: data.newBalance as number,
      }),
    };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Regeneration failed',
    };
  }
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
