'use server';

import { dbClient, user, encrypt, decrypt } from '@temar/db-client';
import { eq } from 'drizzle-orm';
import { getLoggedInUser } from '@/lib/fetchers/users';
import { revalidatePath } from 'next/cache';

export type AiProvider = 'google' | 'openai' | 'anthropic';

export type AiSettings = {
  provider: AiProvider | null;
  model: string | null;
  hasApiKey: boolean;
  maxQuestionReviews: number;
};

export async function getAiSettings(): Promise<AiSettings> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return {
      provider: null,
      model: null,
      hasApiKey: false,
      maxQuestionReviews: 5,
    };
  }

  const [row] = await dbClient
    .select({
      aiProvider: user.aiProvider,
      aiModel: user.aiModel,
      aiApiKeyEncrypted: user.aiApiKeyEncrypted,
      maxQuestionReviews: user.maxQuestionReviews,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!row) {
    return {
      provider: null,
      model: null,
      hasApiKey: false,
      maxQuestionReviews: 5,
    };
  }

  return {
    provider: (row.aiProvider as AiProvider) ?? null,
    model: row.aiModel ?? null,
    hasApiKey: !!row.aiApiKeyEncrypted,
    maxQuestionReviews: row.maxQuestionReviews ?? 5,
  };
}

export async function saveAiSettings(
  provider: AiProvider | null,
  model: string | null,
  apiKey?: string
): Promise<{ success: boolean; error?: string }> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const updateData: Record<string, string | null> = {
      aiProvider: provider,
      aiModel: model,
    };

    if (apiKey !== undefined) {
      updateData.aiApiKeyEncrypted = apiKey ? encrypt(apiKey) : null;
    }

    await dbClient
      .update(user)
      .set(updateData)
      .where(eq(user.id, sessionUser.id));

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err) {
    console.error('Failed to save AI settings:', err);
    return { success: false, error: 'Failed to save settings' };
  }
}

export async function saveMaxQuestionReviews(
  value: number
): Promise<{ success: boolean; error?: string }> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await dbClient
      .update(user)
      .set({ maxQuestionReviews: Math.max(1, Math.floor(value)) })
      .where(eq(user.id, sessionUser.id));

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err) {
    console.error('Failed to save max question reviews:', err);
    return { success: false, error: 'Failed to save setting' };
  }
}

export async function clearAiApiKey(): Promise<{
  success: boolean;
  error?: string;
}> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await dbClient
      .update(user)
      .set({ aiApiKeyEncrypted: null })
      .where(eq(user.id, sessionUser.id));

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err) {
    console.error('Failed to clear API key:', err);
    return { success: false, error: 'Failed to clear API key' };
  }
}

/**
 * Get the user's decrypted AI config for use in server-side calls.
 * NEVER expose this to the client — only use in other server actions.
 */
export async function getUserAiConfig(): Promise<
  { provider: string; model: string; apiKey: string } | undefined
> {
  const sessionUser = await getLoggedInUser();
  if (!sessionUser) return undefined;

  const [row] = await dbClient
    .select({
      aiProvider: user.aiProvider,
      aiModel: user.aiModel,
      aiApiKeyEncrypted: user.aiApiKeyEncrypted,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!row?.aiProvider || !row?.aiApiKeyEncrypted) return undefined;

  try {
    return {
      provider: row.aiProvider,
      model: row.aiModel || '',
      apiKey: decrypt(row.aiApiKeyEncrypted),
    };
  } catch {
    return undefined;
  }
}
