'use server';

import { revalidatePath } from 'next/cache';
import { dbClient, topic, user, eq } from '@temar/db-client';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { syncServiceFetch } from '../sync-service';

/**
 * Completely resets all user data:
 * 1. Deletes all recall items, review logs, chunk tracking (via ON DELETE CASCADE from topics)
 * 2. Deletes all topics (cascades to notes → chunks → recall items / review logs)
 * 3. Archives the Notion master page (if connected)
 * 4. Clears all Notion connection fields on the user record
 *
 * After this, the user can reconnect Notion and start fresh.
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
    // 1. Delete all topics for this user
    //    ON DELETE CASCADE handles: notes → chunks → recallItems → reviewLogs
    await dbClient.delete(topic).where(eq(topic.userId, loggedInUser.id));

    // 2. Archive the Notion master page if it exists
    const [userData] = await dbClient
      .select({ notionPageId: user.notionPageId })
      .from(user)
      .where(eq(user.id, loggedInUser.id))
      .limit(1);

    if (userData?.notionPageId) {
      try {
        await syncServiceFetch(`page/${userData.notionPageId}`, {
          method: 'DELETE',
          userId: loggedInUser.id,
        });
      } catch (err) {
        // Non-fatal: Notion page may already be deleted or inaccessible
        console.warn('Failed to archive Notion master page:', err);
      }
    }

    // 3. Clear all Notion connection fields on the user record
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
