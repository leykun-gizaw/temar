/**
 * Idempotent seed script for AI pricing tables.
 * Run: pnpm nx run db-client:seed
 */
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../../../.env' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  aiModel,
  aiModelPricing,
  aiMarkupConfig,
  operationConfig,
} from '../schema/ai-pricing-schema';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT),
});

const db = drizzle({ client: pool });

// ---------------------------------------------------------------------------
// Seed data (from current MODEL_CONFIGS in ai-operations.ts)
// ---------------------------------------------------------------------------

const MODELS = [
  { id: 'gemini-3-flash', provider: 'google', label: 'Gemini 3 Flash' },
  { id: 'gemini-2.5-flash', provider: 'google', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', provider: 'google', label: 'Gemini 2.5 Pro' },
  { id: 'gpt-4.1-nano', provider: 'openai', label: 'GPT-4.1 Nano' },
  { id: 'gpt-4.1-mini', provider: 'openai', label: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1', provider: 'openai', label: 'GPT-4.1' },
  { id: 'o4-mini', provider: 'openai', label: 'o4-mini' },
  { id: 'claude-haiku-4-20250414', provider: 'anthropic', label: 'Claude Haiku 4' },
  { id: 'claude-sonnet-4-20250514', provider: 'anthropic', label: 'Claude Sonnet 4' },
];

const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3-flash': { input: 0.1, output: 0.4 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'o4-mini': { input: 1.1, output: 4.4 },
  'claude-haiku-4-20250414': { input: 0.8, output: 4.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
};

// Markup curve strategy:
//   1.0 = cost pass-through (no markup)
//   Adjust per model to reflect demand, margin targets, or promotional rates.
//   Changes are versioned via effective_from / effective_to.
const DEFAULT_MARKUP = 1.0;

const OPERATIONS = [
  { operationType: 'question_generation', label: 'Question Generation', maxInputTokens: 4000, maxOutputTokens: 2000, isCurrentFeature: true },
  { operationType: 'answer_analysis', label: 'Answer Analysis', maxInputTokens: 2000, maxOutputTokens: 1000, isCurrentFeature: true },
  { operationType: 'chunk_enhancement', label: 'Chunk Enhancement', maxInputTokens: 2000, maxOutputTokens: 1000, isCurrentFeature: false },
  { operationType: 'content_generation', label: 'Content Generation', maxInputTokens: 8000, maxOutputTokens: 4000, isCurrentFeature: false },
];

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding AI pricing tables...');

  // 1. Models
  for (const m of MODELS) {
    await db
      .insert(aiModel)
      .values(m)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${MODELS.length} models`);

  // 2. Pricing (only insert if no active row exists)
  for (const m of MODELS) {
    const p = PRICING[m.id];
    if (!p) continue;
    await db
      .insert(aiModelPricing)
      .values({
        modelId: m.id,
        inputPricePer1M: p.input,
        outputPricePer1M: p.output,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${Object.keys(PRICING).length} pricing rows`);

  // 3. Markup (default 1.0 for all models)
  for (const m of MODELS) {
    await db
      .insert(aiMarkupConfig)
      .values({
        modelId: m.id,
        markupFactor: DEFAULT_MARKUP,
        changeReason: 'Initial seed — cost pass-through',
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${MODELS.length} markup rows (factor=${DEFAULT_MARKUP})`);

  // 4. Operation configs
  for (const op of OPERATIONS) {
    await db
      .insert(operationConfig)
      .values(op)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${OPERATIONS.length} operation configs`);

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
