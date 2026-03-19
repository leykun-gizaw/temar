/**
 * Idempotent seed script for AI pricing tables.
 * Fetches available models from Google, Anthropic, and Deepseek APIs,
 * then seeds the database with the models and known pricing data.
 *
 * Run: pnpm nx run db-client:seed
 */
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import {
  aiModel,
  aiModelPricing,
  aiMarkupConfig,
  operationConfig,
} from '../schema/ai-pricing-schema';
import { fetchAllProviderModels } from '../lib/fetch-provider-models';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT),
});

const db = drizzle({ client: pool });

// ---------------------------------------------------------------------------
// Known pricing (USD per 1M tokens) — used as fallback for seeded models
// ---------------------------------------------------------------------------

const KNOWN_PRICING: Record<string, { input: number; output: number }> = {
  // ── Google Gemini (per 1M tokens, standard paid tier, ≤200k context) ──
  // Gemini 3.x
  'gemini-3.1-pro-preview': { input: 2.0, output: 12.0 },
  'gemini-3.1-pro-preview-customtools': { input: 2.0, output: 12.0 },
  'gemini-3.1-flash-lite-preview': { input: 0.25, output: 1.5 },
  'gemini-3-flash-preview': { input: 0.5, output: 3.0 },
  // Gemini 2.5
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-2.5-flash-lite-preview-09-2025': { input: 0.1, output: 0.4 },
  'gemini-2.5-computer-use-preview-10-2025': { input: 1.25, output: 10.0 },
  // Gemini 2.0 (deprecated June 2026)
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-2.0-flash-001': { input: 0.1, output: 0.4 },
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.3 },
  'gemini-2.0-flash-lite-001': { input: 0.075, output: 0.3 },
  // Robotics
  'gemini-robotics-er-1.5-preview': { input: 0.3, output: 2.5 },
  // OpenAI
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'o4-mini': { input: 1.1, output: 4.4 },
  // Anthropic
  'claude-haiku-4-20250414': { input: 0.8, output: 4.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  // Deepseek
  'deepseek-chat': { input: 0.27, output: 1.1 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
};

// Backfill: map old pricing model IDs → actual provider model IDs
const LEGACY_MODEL_MAP: Record<
  string,
  { providerModelId: string; label: string; provider: string }
> = {
  'gemini-3-flash': {
    providerModelId: 'gemini-2.0-flash',
    label: 'Gemini 3 Flash',
    provider: 'google',
  },
  // These are now stable GA models — provider_model_id matches the id
  'gemini-2.5-flash': {
    providerModelId: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'google',
  },
  'gemini-2.5-pro': {
    providerModelId: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    provider: 'google',
  },
};

const DEFAULT_MARKUP = 1.0;

const OPERATIONS = [
  {
    operationType: 'question_generation',
    label: 'Question Generation',
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    isCurrentFeature: true,
  },
  {
    operationType: 'answer_analysis',
    label: 'Answer Analysis',
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    isCurrentFeature: true,
  },
  {
    operationType: 'chunk_enhancement',
    label: 'Chunk Enhancement',
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    isCurrentFeature: false,
  },
  {
    operationType: 'content_generation',
    label: 'Content Generation',
    maxInputTokens: 8000,
    maxOutputTokens: 4000,
    isCurrentFeature: false,
  },
];

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding AI pricing tables...\n');

  // 1. Fetch models from provider APIs
  console.log('Fetching models from provider APIs...');
  const { models: fetchedModels, errors } = await fetchAllProviderModels({
    googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  });

  if (errors.length > 0) {
    console.warn('  ⚠ Some providers failed:');
    for (const err of errors) console.warn(`    - ${err}`);
  }
  console.log(`  Fetched ${fetchedModels.length} models from APIs\n`);

  // 2. Insert fetched models (using provider model ID as the DB id)
  let insertedCount = 0;
  for (const m of fetchedModels) {
    const result = await db
      .insert(aiModel)
      .values({
        id: m.id,
        provider: m.provider,
        label: m.label,
        providerModelId: m.id, // for API-fetched models, id IS the provider model ID
      })
      .onConflictDoNothing()
      .returning();
    if (result.length > 0) insertedCount++;
  }
  console.log(
    `  ✓ ${insertedCount} new models inserted (${fetchedModels.length - insertedCount} already existed)`
  );

  // 3. Backfill provider_model_id for legacy models
  console.log('\nBackfilling provider_model_id for legacy models...');
  for (const [legacyId, info] of Object.entries(LEGACY_MODEL_MAP)) {
    await db
      .update(aiModel)
      .set({ providerModelId: info.providerModelId })
      .where(eq(aiModel.id, legacyId));
  }
  console.log(`  ✓ ${Object.keys(LEGACY_MODEL_MAP).length} legacy models updated`);

  // 4. Seed pricing for models with known pricing (skip if active row exists)
  console.log('\nSeeding pricing...');
  let pricingCount = 0;
  const allModelIds = [
    ...fetchedModels.map((m) => m.id),
    ...Object.keys(LEGACY_MODEL_MAP),
  ];
  const seenIds = new Set<string>();
  for (const modelId of allModelIds) {
    if (seenIds.has(modelId)) continue;
    seenIds.add(modelId);
    const p = KNOWN_PRICING[modelId];
    if (!p) continue;
    // Check if model exists in ai_models
    const [modelRow] = await db
      .select({ id: aiModel.id })
      .from(aiModel)
      .where(eq(aiModel.id, modelId))
      .limit(1);
    if (!modelRow) continue;
    // Check for existing active pricing row
    const [existing] = await db
      .select({ id: aiModelPricing.id })
      .from(aiModelPricing)
      .where(eq(aiModelPricing.modelId, modelId))
      .limit(1);
    if (existing) continue;
    await db.insert(aiModelPricing).values({
      modelId,
      inputPricePer1M: p.input,
      outputPricePer1M: p.output,
    });
    pricingCount++;
  }
  console.log(`  ✓ ${pricingCount} pricing rows inserted`);

  // 5. Seed markup (default 1.0 for models that don't have one yet)
  console.log('\nSeeding markup...');
  let markupCount = 0;
  for (const m of fetchedModels) {
    const [existingMarkup] = await db
      .select({ id: aiMarkupConfig.id })
      .from(aiMarkupConfig)
      .where(eq(aiMarkupConfig.modelId, m.id))
      .limit(1);
    if (existingMarkup) continue;
    await db.insert(aiMarkupConfig).values({
      modelId: m.id,
      markupFactor: DEFAULT_MARKUP,
      changeReason: 'Initial seed — cost pass-through',
    });
    markupCount++;
  }
  console.log(`  ✓ ${markupCount} markup rows inserted`);

  // 6. Operation configs
  console.log('\nSeeding operation configs...');
  for (const op of OPERATIONS) {
    await db.insert(operationConfig).values(op).onConflictDoNothing();
  }
  console.log(`  ✓ ${OPERATIONS.length} operation configs`);

  console.log('\nSeed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
