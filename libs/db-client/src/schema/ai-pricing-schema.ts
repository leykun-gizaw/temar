import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  real,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

// ---------------------------------------------------------------------------
// ai_models — master list of AI models
// ---------------------------------------------------------------------------
export const aiModel = pgTable('ai_models', {
  id: text('id').primaryKey(), // e.g. 'gemini-3-flash'
  provider: text('provider').notNull(), // 'google' | 'openai' | 'anthropic'
  label: text('label').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ---------------------------------------------------------------------------
// ai_model_pricing — versioned provider pricing (append-only)
// ---------------------------------------------------------------------------
export const aiModelPricing = pgTable(
  'ai_model_pricing',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    modelId: text('model_id')
      .notNull()
      .references(() => aiModel.id, { onDelete: 'cascade' }),
    inputPricePer1M: real('input_price_per_1m').notNull(), // USD per 1M input tokens
    outputPricePer1M: real('output_price_per_1m').notNull(), // USD per 1M output tokens
    effectiveFrom: timestamp('effective_from', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    effectiveTo: timestamp('effective_to', { withTimezone: true }), // null = current
    changeReason: text('change_reason'),
  },
  (table) => [
    index('ai_model_pricing_model_idx').on(table.modelId),
    index('ai_model_pricing_active_idx').on(table.modelId, table.effectiveTo),
  ]
);

// ---------------------------------------------------------------------------
// ai_markup_config — versioned per-model markup factors (append-only)
//
// Markup curve strategy (for future margin adjustments):
//   1.0 = cost pass-through (no markup)
//   1.2 = 20% markup on top of provider pricing
//   Adjust per model to reflect demand, margin targets, or promotional rates.
//   Changes are versioned: close the old row, insert a new one.
// ---------------------------------------------------------------------------
export const aiMarkupConfig = pgTable(
  'ai_markup_config',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    modelId: text('model_id')
      .notNull()
      .references(() => aiModel.id, { onDelete: 'cascade' }),
    markupFactor: real('markup_factor').notNull().default(1.0),
    effectiveFrom: timestamp('effective_from', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    effectiveTo: timestamp('effective_to', { withTimezone: true }), // null = current
    changeReason: text('change_reason'),
  },
  (table) => [
    index('ai_markup_model_idx').on(table.modelId),
    index('ai_markup_active_idx').on(table.modelId, table.effectiveTo),
  ]
);

// ---------------------------------------------------------------------------
// operation_configs — operation type definitions and token budgets
// ---------------------------------------------------------------------------
export const operationConfig = pgTable('operation_configs', {
  operationType: text('operation_type').primaryKey(),
  label: text('label').notNull(),
  maxInputTokens: integer('max_input_tokens').notNull(),
  maxOutputTokens: integer('max_output_tokens').notNull(),
  isCurrentFeature: boolean('is_current_feature').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ---------------------------------------------------------------------------
// ai_usage_log — permanent audit trail (append-only, never update/delete)
// ---------------------------------------------------------------------------
export const aiUsageLog = pgTable(
  'ai_usage_log',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    modelId: text('model_id')
      .notNull()
      .references(() => aiModel.id),
    operationType: text('operation_type')
      .notNull()
      .references(() => operationConfig.operationType),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    // Denormalized pricing snapshot at time of usage
    inputPricePer1MSnapshot: real('input_price_per_1m_snapshot').notNull(),
    outputPricePer1MSnapshot: real('output_price_per_1m_snapshot').notNull(),
    markupFactorSnapshot: real('markup_factor_snapshot').notNull(),
    computedCostUsd: real('computed_cost_usd').notNull(),
    passCharged: integer('pass_charged').notNull(),
    isByok: boolean('is_byok').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('ai_usage_log_user_idx').on(table.userId),
    index('ai_usage_log_model_idx').on(table.modelId),
    index('ai_usage_log_created_idx').on(table.createdAt),
    uniqueIndex('ai_usage_log_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
  ]
);
