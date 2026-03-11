'use server';

import { revalidatePath } from 'next/cache';
import { ChunkInputSchema } from '../zod/chunk-schema';
import { ErrorState } from '../definitions';
import { dbClient, chunk, eq, and, sql } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';

export async function createChunk(
  state: ErrorState | undefined,
  payload: FormData
): Promise<ErrorState> {
  const validatedFields = ChunkInputSchema.safeParse({
    title: payload.get('title'),
    description: payload.get('description'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create chunk.',
    };

  const noteId = payload.get('noteId') as string;
  const topicId = payload.get('topicId') as string;
  if (!noteId || !topicId) {
    return { errors: {}, message: 'Note ID and Topic ID are required.' };
  }

  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error('User not logged in');

    const { title, description } = validatedFields.data;

    const [{ id: newId }] = await dbClient
      .select({ id: sql<string>`gen_random_uuid()` })
      .from(sql`(SELECT 1) AS _`);

    await dbClient.insert(chunk).values({
      id: newId,
      noteId,
      name: title,
      description,
      createdAt: new Date(),
      userId: loggedInUser.id,
    });

    revalidatePath('/dashboard/materials');
    return { errors: {}, message: 'Chunk created successfully.' };
  } catch (err) {
    console.error('createChunk error:', err);
    return {
      errors: {},
      message: `Database Error: Failed to create chunk. ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

export async function updateChunkContent(
  chunkId: string,
  contentJson: unknown,
  contentMd: string
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
    .set({
      contentJson,
      contentMd,
      contentUpdatedAt: new Date(),
    })
    .where(eq(chunk.id, chunkId));
}
