'use server';

import { revalidatePath } from 'next/cache';
import {
  dbClient,
  operationConfig,
  eq,
} from '@temar/db-client';

export async function fetchAllOperations() {
  return dbClient.select().from(operationConfig);
}

export async function updateOperation(formData: FormData) {
  const operationType = formData.get('operationType') as string;
  const label = formData.get('label') as string;
  const maxInputTokens = parseInt(formData.get('maxInputTokens') as string, 10);
  const maxOutputTokens = parseInt(formData.get('maxOutputTokens') as string, 10);
  const isCurrentFeature = formData.get('isCurrentFeature') === 'true';
  const isActive = formData.get('isActive') === 'true';

  if (!operationType || !label || isNaN(maxInputTokens) || isNaN(maxOutputTokens)) {
    return { error: 'All fields are required' };
  }

  try {
    await dbClient
      .update(operationConfig)
      .set({ label, maxInputTokens, maxOutputTokens, isCurrentFeature, isActive })
      .where(eq(operationConfig.operationType, operationType));
    revalidatePath('/operations');
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}
