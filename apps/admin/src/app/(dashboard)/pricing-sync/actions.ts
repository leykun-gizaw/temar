'use server';

import { revalidatePath } from 'next/cache';
import {
  dbClient,
  aiModel,
  aiModelPricing,
  aiMarkupConfig,
  eq,
  and,
  isNull,
  closeActivePricingRow,
  insertPricingRow,
  insertMarkupRow,
} from '@temar/db-client';
import {
  fetchAllProviderPricing,
  slugToModelId,
  authorToProvider,
  type PricePerTokenModel,
} from '@/lib/pricepertoken-client';

// ── Types ──

export interface LatestModel {
  id: string;
  provider: string;
  label: string;
  slug: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
}

export interface CurrentPricing {
  modelId: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  effectiveFrom: Date;
}

export type DiffStatus = 'changed' | 'new' | 'unchanged';

export interface PricingDiffRow {
  modelId: string;
  provider: string;
  label: string;
  status: DiffStatus;
  currentInput: number | null;
  currentOutput: number | null;
  latestInput: number;
  latestOutput: number;
}

export interface FetchResult {
  diff: PricingDiffRow[];
  fetchedCount: number;
  errors: string[];
  checkedAt: string;
}

// ── Server actions ──

export async function fetchAndComparePricing(): Promise<FetchResult> {
  const [mcpResult, currentRows] = await Promise.all([
    fetchAllProviderPricing(),
    fetchCurrentPricing(),
  ]);
  const currentMap = new Map(currentRows.map((r) => [r.modelId, r]));

  const latest: LatestModel[] = mcpResult.models.map(
    (m: PricePerTokenModel) => ({
      id: slugToModelId(m.slug, m.author_name),
      provider: authorToProvider(m.author_name),
      label: m.model_name,
      slug: m.slug,
      inputPricePer1M: m.input_per_1m!,
      outputPricePer1M: m.output_per_1m!,
    })
  );

  const diff: PricingDiffRow[] = latest.map((m) => {
    const current = currentMap.get(m.id);
    if (!current) {
      return {
        modelId: m.id,
        provider: m.provider,
        label: m.label,
        status: 'new' as const,
        currentInput: null,
        currentOutput: null,
        latestInput: m.inputPricePer1M,
        latestOutput: m.outputPricePer1M,
      };
    }
    const inputChanged =
      Math.abs(current.inputPricePer1M - m.inputPricePer1M) > 0.0001;
    const outputChanged =
      Math.abs(current.outputPricePer1M - m.outputPricePer1M) > 0.0001;

    return {
      modelId: m.id,
      provider: m.provider,
      label: m.label,
      status: (inputChanged || outputChanged
        ? 'changed'
        : 'unchanged') as DiffStatus,
      currentInput: current.inputPricePer1M,
      currentOutput: current.outputPricePer1M,
      latestInput: m.inputPricePer1M,
      latestOutput: m.outputPricePer1M,
    };
  });

  // Sort: changed first, then new, then unchanged
  const order: Record<DiffStatus, number> = {
    changed: 0,
    new: 1,
    unchanged: 2,
  };
  diff.sort((a, b) => order[a.status] - order[b.status]);

  return {
    diff,
    fetchedCount: mcpResult.models.length,
    errors: mcpResult.errors,
    checkedAt: new Date().toISOString(),
  };
}

async function fetchCurrentPricing(): Promise<CurrentPricing[]> {
  const rows = await dbClient
    .select({
      modelId: aiModelPricing.modelId,
      inputPricePer1M: aiModelPricing.inputPricePer1M,
      outputPricePer1M: aiModelPricing.outputPricePer1M,
      effectiveFrom: aiModelPricing.effectiveFrom,
    })
    .from(aiModelPricing)
    .where(isNull(aiModelPricing.effectiveTo));

  return rows as CurrentPricing[];
}

export interface ApplyChange {
  modelId: string;
  provider: string;
  label: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  isNew: boolean;
}

export async function applyPricingChanges(
  changes: ApplyChange[]
): Promise<{ applied: number; errors: string[] }> {
  const errors: string[] = [];
  let applied = 0;
  const reason = `pricepertoken sync ${new Date().toISOString().slice(0, 10)}`;

  for (const change of changes) {
    try {
      // 1. Upsert ai_models row
      await dbClient
        .insert(aiModel)
        .values({
          id: change.modelId,
          provider: change.provider,
          label: change.label,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: aiModel.id,
          set: { label: change.label, provider: change.provider },
        });

      // 2. Close active pricing row (if exists)
      await closeActivePricingRow(change.modelId);

      // 3. Insert new pricing row
      await insertPricingRow({
        modelId: change.modelId,
        inputPricePer1M: change.inputPricePer1M,
        outputPricePer1M: change.outputPricePer1M,
        changeReason: reason,
      });

      // 4. Ensure markup row exists
      const [existingMarkup] = await dbClient
        .select({ id: aiMarkupConfig.id })
        .from(aiMarkupConfig)
        .where(
          and(
            eq(aiMarkupConfig.modelId, change.modelId),
            isNull(aiMarkupConfig.effectiveTo)
          )
        )
        .limit(1);

      if (!existingMarkup) {
        await insertMarkupRow({
          modelId: change.modelId,
          markupFactor: 1.0,
          changeReason: 'Auto-sync — cost pass-through',
        });
      }

      applied++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${change.modelId}: ${msg}`);
    }
  }

  revalidatePath('/pricing');
  revalidatePath('/pricing-sync');
  revalidatePath('/models');

  return { applied, errors };
}
