'use server';

import { revalidatePath } from 'next/cache';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { fsrsServiceFetch } from '../fsrs-service';
import { getAiHeaders } from './ai-headers';
import { checkPassAvailability } from './pass';
import { dbClient, chunk, note, chunkTracking, eq, and } from '@temar/db-client';
import { getCostPerPassUsd } from '@/lib/config/ai-operations';

export type TrackResult<T = unknown> =
  | { status: 'success'; data: T; newBalance?: number }
  | { status: 'error'; message: string }
  | { status: 'insufficient_pass'; balance: number; required: number }

async function passCheckForGeneration(): Promise<
  { ok: true } | { ok: false; result: TrackResult }
> {
  const passResult = await checkPassAvailability('question_generation');

  if (passResult.status === 'ok') {
    return { ok: true };
  }
  return { ok: false, result: passResult as TrackResult };
}

export interface CascadeChunkInfo {
  id: string;
  name: string;
  isTracked: boolean;
}

export interface CascadeInfo {
  total: number;
  tracked: number;
  untracked: number;
  chunks: CascadeChunkInfo[];
}

/** Returns the tracked/untracked breakdown for all chunks under a topic or note. */
export async function getCascadeInfo(
  entityType: 'topic' | 'note',
  entityId: string
): Promise<CascadeInfo> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const rows =
    entityType === 'topic'
      ? await dbClient
          .select({
            id: chunk.id,
            name: chunk.name,
            trackingStatus: chunkTracking.status,
          })
          .from(chunk)
          .innerJoin(note, eq(chunk.noteId, note.id))
          .leftJoin(
            chunkTracking,
            and(
              eq(chunkTracking.chunkId, chunk.id),
              eq(chunkTracking.userId, loggedInUser.id)
            )
          )
          .where(eq(note.topicId, entityId))
      : await dbClient
          .select({
            id: chunk.id,
            name: chunk.name,
            trackingStatus: chunkTracking.status,
          })
          .from(chunk)
          .leftJoin(
            chunkTracking,
            and(
              eq(chunkTracking.chunkId, chunk.id),
              eq(chunkTracking.userId, loggedInUser.id)
            )
          )
          .where(eq(chunk.noteId, entityId));

  const chunks: CascadeChunkInfo[] = rows.map((r) => ({
    id: r.id,
    name: r.name ?? 'Untitled',
    isTracked:
      r.trackingStatus != null && r.trackingStatus !== 'untracked',
  }));

  const tracked = chunks.filter((c) => c.isTracked).length;

  return {
    total: chunks.length,
    tracked,
    untracked: chunks.length - tracked,
    chunks,
  };
}

export async function trackTopic(
  topicId: string,
  questionTypes?: string[],
  questionCount?: number
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  // Count only UNTRACKED chunks for accurate cost estimation
  const info = await getCascadeInfo('topic', topicId);
  const numNewChunks = info.untracked;

  if (numNewChunks === 0) {
    return { status: 'success', data: { message: 'All chunks already tracked' } };
  }

  const passCheck = await passCheckForGeneration();
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
        newBalance: Math.floor((data.newBalance as number) / getCostPerPassUsd()),
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
  questionCount?: number
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  // Count only UNTRACKED chunks for accurate cost estimation
  const info = await getCascadeInfo('note', noteId);
  const numNewChunks = info.untracked;

  if (numNewChunks === 0) {
    return { status: 'success', data: { message: 'All chunks already tracked' } };
  }

  const passCheck = await passCheckForGeneration();
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
        newBalance: Math.floor((data.newBalance as number) / getCostPerPassUsd()),
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
  questionCount?: number
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const passCheck = await passCheckForGeneration();
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
        newBalance: Math.floor((data.newBalance as number) / getCostPerPassUsd()),
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

export interface ChunkTrackConfig {
  chunkId: string;
  questionTypes: string[];
  questionCount: number;
}

/** Track multiple chunks individually with per-chunk question type configs. */
export async function trackChunksBatch(
  configs: ChunkTrackConfig[]
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  if (configs.length === 0) {
    return { status: 'success', data: { message: 'No chunks to track' } };
  }

  const passCheck = await passCheckForGeneration();
  if (!passCheck.ok) return passCheck.result;

  const aiHeaders = await getAiHeaders();
  let lastBalance: number | null = null;

  for (const cfg of configs) {
    const data = await fsrsServiceFetch<Record<string, unknown>>(
      `track/chunk/${cfg.chunkId}`,
      {
        method: 'POST',
        userId: loggedInUser.id,
        headers: aiHeaders,
        body: {
          questionTypes: cfg.questionTypes,
          questionCount: cfg.questionCount,
        },
      }
    );
    if (data?.newBalance != null) lastBalance = data.newBalance as number;
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/materials');
  return {
    status: 'success',
    data: { tracked: configs.length },
    ...(lastBalance != null && {
      newBalance: Math.floor(lastBalance / getCostPerPassUsd()),
    }),
  };
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
  chunkId: string
): Promise<TrackResult> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) throw new Error('User not logged in');

  const passCheck = await passCheckForGeneration();
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
        newBalance: Math.floor((data.newBalance as number) / getCostPerPassUsd()),
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
