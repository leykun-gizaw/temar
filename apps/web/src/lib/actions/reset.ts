'use server';

import { revalidatePath } from 'next/cache';
import { dbClient, topic, user, eq } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';

/**
 * Completely resets all user data:
 * 1. Deletes all topics (cascades to notes → chunks → recall items / review logs)
 * 2. Clears Notion connection fields on the user record
 */
export async function resetAllData(): Promise<{
  success: boolean;
  error?: string;
}> {
  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await dbClient.delete(topic).where(eq(topic.userId, loggedInUser.id));

    await dbClient
      .update(user)
      .set({
        notionPageId: null,
        notionAccessToken: null,
        notionRefreshToken: null,
        notionBotId: null,
        notionWorkspaceId: null,
        notionTokenExpiresAt: null,
      })
      .where(eq(user.id, loggedInUser.id));

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/materials');
    revalidatePath('/dashboard/reviews');
    revalidatePath('/dashboard/settings');

    return { success: true };
  } catch (err) {
    console.error('Failed to reset all data:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reset data',
    };
  }
}
