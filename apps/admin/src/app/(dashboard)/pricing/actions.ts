'use server';

import { revalidatePath } from 'next/cache';
import { getActiveModels, updateProviderPricing } from '@temar/pricing-service';
import {
  dbClient,
  aiModelPricing,
  eq,
  desc,
} from '@temar/db-client';

export async function fetchModelsWithPricing() {
  return getActiveModels();
}

export async function updatePricing(formData: FormData) {
  const modelId = formData.get('modelId') as string;
  const inputPrice = parseFloat(formData.get('inputPrice') as string);
  const outputPrice = parseFloat(formData.get('outputPrice') as string);
  const reason = formData.get('reason') as string;

  if (!modelId || isNaN(inputPrice) || isNaN(outputPrice)) {
    return { error: 'All fields are required' };
  }

  try {
    await updateProviderPricing(modelId, inputPrice, outputPrice, reason || undefined);
    revalidatePath('/pricing');
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

export async function fetchPricingHistory(modelId: string) {
  return dbClient
    .select()
    .from(aiModelPricing)
    .where(eq(aiModelPricing.modelId, modelId))
    .orderBy(desc(aiModelPricing.effectiveFrom));
}
