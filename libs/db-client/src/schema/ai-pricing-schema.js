"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiUsageLog = exports.operationConfig = exports.aiMarkupConfig = exports.aiModelPricing = exports.aiModel = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
var auth_schema_1 = require("./auth-schema");
// ---------------------------------------------------------------------------
// ai_models — master list of AI models
// ---------------------------------------------------------------------------
exports.aiModel = (0, pg_core_1.pgTable)('ai_models', {
    id: (0, pg_core_1.text)('id').primaryKey(), // e.g. 'gemini-3-flash'
    provider: (0, pg_core_1.text)('provider').notNull(), // 'google' | 'openai' | 'anthropic'
    label: (0, pg_core_1.text)('label').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["now()"], ["now()"])))),
});
// ---------------------------------------------------------------------------
// ai_model_pricing — versioned provider pricing (append-only)
// ---------------------------------------------------------------------------
exports.aiModelPricing = (0, pg_core_1.pgTable)('ai_model_pricing', {
    id: (0, pg_core_1.uuid)('id')
        .default((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["gen_random_uuid()"], ["gen_random_uuid()"]))))
        .primaryKey(),
    modelId: (0, pg_core_1.text)('model_id')
        .notNull()
        .references(function () { return exports.aiModel.id; }, { onDelete: 'cascade' }),
    inputPricePer1M: (0, pg_core_1.real)('input_price_per_1m').notNull(), // USD per 1M input tokens
    outputPricePer1M: (0, pg_core_1.real)('output_price_per_1m').notNull(), // USD per 1M output tokens
    effectiveFrom: (0, pg_core_1.timestamp)('effective_from', { withTimezone: true })
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["now()"], ["now()"])))),
    effectiveTo: (0, pg_core_1.timestamp)('effective_to', { withTimezone: true }), // null = current
    changeReason: (0, pg_core_1.text)('change_reason'),
}, function (table) { return [
    (0, pg_core_1.index)('ai_model_pricing_model_idx').on(table.modelId),
    (0, pg_core_1.index)('ai_model_pricing_active_idx').on(table.modelId, table.effectiveTo),
]; });
// ---------------------------------------------------------------------------
// ai_markup_config — versioned per-model markup factors (append-only)
//
// Markup curve strategy (for future margin adjustments):
//   1.0 = cost pass-through (no markup)
//   1.2 = 20% markup on top of provider pricing
//   Adjust per model to reflect demand, margin targets, or promotional rates.
//   Changes are versioned: close the old row, insert a new one.
// ---------------------------------------------------------------------------
exports.aiMarkupConfig = (0, pg_core_1.pgTable)('ai_markup_config', {
    id: (0, pg_core_1.uuid)('id')
        .default((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["gen_random_uuid()"], ["gen_random_uuid()"]))))
        .primaryKey(),
    modelId: (0, pg_core_1.text)('model_id')
        .notNull()
        .references(function () { return exports.aiModel.id; }, { onDelete: 'cascade' }),
    markupFactor: (0, pg_core_1.real)('markup_factor').notNull().default(1.0),
    effectiveFrom: (0, pg_core_1.timestamp)('effective_from', { withTimezone: true })
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["now()"], ["now()"])))),
    effectiveTo: (0, pg_core_1.timestamp)('effective_to', { withTimezone: true }), // null = current
    changeReason: (0, pg_core_1.text)('change_reason'),
}, function (table) { return [
    (0, pg_core_1.index)('ai_markup_model_idx').on(table.modelId),
    (0, pg_core_1.index)('ai_markup_active_idx').on(table.modelId, table.effectiveTo),
]; });
// ---------------------------------------------------------------------------
// operation_configs — operation type definitions and token budgets
// ---------------------------------------------------------------------------
exports.operationConfig = (0, pg_core_1.pgTable)('operation_configs', {
    operationType: (0, pg_core_1.text)('operation_type').primaryKey(),
    label: (0, pg_core_1.text)('label').notNull(),
    maxInputTokens: (0, pg_core_1.integer)('max_input_tokens').notNull(),
    maxOutputTokens: (0, pg_core_1.integer)('max_output_tokens').notNull(),
    isCurrentFeature: (0, pg_core_1.boolean)('is_current_feature').notNull().default(false),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["now()"], ["now()"])))),
});
// ---------------------------------------------------------------------------
// ai_usage_log — permanent audit trail (append-only, never update/delete)
// ---------------------------------------------------------------------------
exports.aiUsageLog = (0, pg_core_1.pgTable)('ai_usage_log', {
    id: (0, pg_core_1.uuid)('id')
        .default((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["gen_random_uuid()"], ["gen_random_uuid()"]))))
        .primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return auth_schema_1.user.id; }, { onDelete: 'cascade' }),
    modelId: (0, pg_core_1.text)('model_id')
        .notNull()
        .references(function () { return exports.aiModel.id; }),
    operationType: (0, pg_core_1.text)('operation_type')
        .notNull()
        .references(function () { return exports.operationConfig.operationType; }),
    inputTokens: (0, pg_core_1.integer)('input_tokens').notNull(),
    outputTokens: (0, pg_core_1.integer)('output_tokens').notNull(),
    // Denormalized pricing snapshot at time of usage
    inputPricePer1MSnapshot: (0, pg_core_1.real)('input_price_per_1m_snapshot').notNull(),
    outputPricePer1MSnapshot: (0, pg_core_1.real)('output_price_per_1m_snapshot').notNull(),
    markupFactorSnapshot: (0, pg_core_1.real)('markup_factor_snapshot').notNull(),
    computedCostUsd: (0, pg_core_1.real)('computed_cost_usd').notNull(),
    passCharged: (0, pg_core_1.integer)('pass_charged').notNull(),
    isByok: (0, pg_core_1.boolean)('is_byok').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["now()"], ["now()"])))),
}, function (table) { return [
    (0, pg_core_1.index)('ai_usage_log_user_idx').on(table.userId),
    (0, pg_core_1.index)('ai_usage_log_model_idx').on(table.modelId),
    (0, pg_core_1.index)('ai_usage_log_created_idx').on(table.createdAt),
    (0, pg_core_1.uniqueIndex)('ai_usage_log_user_created_idx').on(table.userId, table.createdAt),
]; });
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
