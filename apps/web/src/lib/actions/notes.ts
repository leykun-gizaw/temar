'use server';

import { revalidatePath } from 'next/cache';
import { NoteInputSchema } from '../zod/note-schema';
import { ErrorState } from '../definitions';
import { dbClient, note, sql } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';

export async function createNote(
  state: ErrorState | undefined,
  payload: FormData
): Promise<ErrorState> {
  const validatedFields = NoteInputSchema.safeParse({
    title: payload.get('title'),
    description: payload.get('description'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create note.',
    };

  const topicId = payload.get('topicId') as string;
  if (!topicId) {
    return { errors: {}, message: 'Topic ID is required.' };
  }

  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error('User not logged in');

    const { title, description } = validatedFields.data;

    const [{ id: newId }] = await dbClient
      .select({ id: sql<string>`gen_random_uuid()` })
      .from(sql`(SELECT 1) AS _`);

    await dbClient.insert(note).values({
      id: newId,
      topicId,
      name: title,
      description,
      createdAt: new Date(),
      userId: loggedInUser.id,
    });

    revalidatePath('/dashboard/materials');
    return { errors: {}, message: 'Note created successfully.' };
  } catch (err) {
    console.error('createNote error:', err);
    return {
      errors: {},
      message: `Database Error: Failed to create note. ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
