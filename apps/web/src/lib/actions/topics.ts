'use server';

import { revalidatePath } from 'next/cache';
import { TopicInputSchema } from '../zod/topic-schema';
import { ErrorState } from '../definitions';
import { dbClient, topic, sql } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';

export async function createTopic(
  state: ErrorState | undefined,
  payload: FormData
): Promise<ErrorState> {
  const validatedFields = TopicInputSchema.safeParse({
    title: payload.get('title'),
    description: payload.get('description'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create topic.',
    };

  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error('User not logged in');

    const { title, description } = validatedFields.data;

    const [{ id: newId }] = await dbClient
      .select({ id: sql<string>`gen_random_uuid()` })
      .from(sql`(SELECT 1) AS _`);

    await dbClient.insert(topic).values({
      id: newId,
      name: title,
      description,
      createdAt: new Date(),
      userId: loggedInUser.id,
    });

    revalidatePath('/dashboard/materials');
    return { errors: {}, message: 'Topic created successfully.' };
  } catch (err) {
    console.error('createTopic error:', err);
    return {
      errors: {},
      message: `Database Error: Failed to create topic. ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
