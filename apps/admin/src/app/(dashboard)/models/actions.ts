'use server';

import { revalidatePath } from 'next/cache';
import {
  dbClient,
  aiModel,
  aiModelPricing,
  aiMarkupConfig,
  eq,
  isNull,
  and,
} from '@temar/db-client';

export async function addModel(formData: FormData) {
  const id = formData.get('modelId') as string;
  const provider = formData.get('provider') as string;
  const label = formData.get('label') as string;

  if (!id || !provider || !label) {
    return { error: 'All fields are required' };
  }

  try {
    await dbClient.insert(aiModel).values({ id, provider, label });
    revalidatePath('/models');
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

export async function toggleModelActive(modelId: string, isActive: boolean) {
  await dbClient
    .update(aiModel)
    .set({ isActive })
    .where(eq(aiModel.id, modelId));
  revalidatePath('/models');
}

export async function getAllModels() {
  return dbClient.select().from(aiModel);
}

export async function getModelWarnings() {
  const models = await dbClient.select().from(aiModel);
  const warnings: Record<string, string[]> = {};

  for (const model of models) {
    const msgs: string[] = [];

    const [pricing] = await dbClient
      .select()
      .from(aiModelPricing)
      .where(
        and(
          eq(aiModelPricing.modelId, model.id),
          isNull(aiModelPricing.effectiveTo)
        )
      )
      .limit(1);

    if (!pricing) msgs.push('Missing active pricing row');

    const [markup] = await dbClient
      .select()
      .from(aiMarkupConfig)
      .where(
        and(
          eq(aiMarkupConfig.modelId, model.id),
          isNull(aiMarkupConfig.effectiveTo)
        )
      )
      .limit(1);

    if (!markup) msgs.push('Missing active markup row');

    if (msgs.length > 0) warnings[model.id] = msgs;
  }

  return warnings;
}
