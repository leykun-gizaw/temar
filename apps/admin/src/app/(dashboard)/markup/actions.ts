'use server';

import { revalidatePath } from 'next/cache';
import { getActiveModels, updateMarkup } from '@temar/pricing-service';
import { dbClient, aiMarkupConfig, eq, desc } from '@temar/db-client';

export async function fetchModelsWithMarkup() {
  return getActiveModels();
}

export async function updateMarkupAction(formData: FormData) {
  const modelId = formData.get('modelId') as string;
  const factor = parseFloat(formData.get('markupFactor') as string);
  const reason = formData.get('reason') as string;

  if (!modelId || isNaN(factor) || factor < 1.0) {
    return { error: 'Invalid input. Markup factor must be >= 1.0' };
  }

  try {
    await updateMarkup(modelId, factor, reason || undefined);
    revalidatePath('/markup');
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

export async function fetchMarkupHistory(modelId: string) {
  return dbClient
    .select()
    .from(aiMarkupConfig)
    .where(eq(aiMarkupConfig.modelId, modelId))
    .orderBy(desc(aiMarkupConfig.effectiveFrom));
}
