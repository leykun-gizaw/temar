'use server';

import { revalidatePath } from 'next/cache';
import { MasterPageInputSchema } from '../zod/master-page-schema';
import { MasterPageErrorState } from '../definitions';
import { dbClient, user } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { eq } from 'drizzle-orm';

export async function createMasterPage(
  state: MasterPageErrorState | undefined,
  payload: FormData
): Promise<MasterPageErrorState> {
  const validatedFields = MasterPageInputSchema.safeParse({
    notionMasterPageId: payload.get('notionMasterPageId'),
  });

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create master page.',
    };

  try {
    const notionPageId = payload.get('notionMasterPageId') as string;
    const loggedInUser = await getLoggedInUser();
    const notionServiceApiEndpoint = process.env.NOTION_SERVICE_API_ENDPOINT;

    if (!loggedInUser) throw Error('User not logged in');
    if (!notionPageId) throw Error('Page ID not found');
    await dbClient
      .update(user)
      .set({ notionPageId })
      .where(eq(user.id, loggedInUser.id));
    const response = await fetch(
      `${notionServiceApiEndpoint}/page/${notionPageId}/prep_notion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notionPageId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Notion master page ID');
    } else revalidatePath('dashboard/topics');
    return { errors: {}, message: 'Master page created successfully.' };
  } catch {
    return {
      errors: {},
      message: 'Database Error: Failed to create master page.',
    };
  }
}
