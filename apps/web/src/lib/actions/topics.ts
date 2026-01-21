'use server';

import { revalidatePath } from 'next/cache';
import { TopicInputSchema } from '../zod/topic-schema';
import { ErrorState } from '../definitions';

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
    revalidatePath('dashboard/topics');
    return { errors: {}, message: 'Topic created successfully.' };
  } catch {
    return { errors: {}, message: 'Database Error: Failed to create topic.' };
  }
}
