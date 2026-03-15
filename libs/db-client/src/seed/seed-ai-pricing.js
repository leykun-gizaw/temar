"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Idempotent seed script for AI pricing tables.
 * Run: pnpm nx run db-client:seed
 */
var dotenv_1 = require("dotenv");
dotenv_1.default.config({ path: __dirname + '/../../../.env' });
var node_postgres_1 = require("drizzle-orm/node-postgres");
var pg_1 = require("pg");
var ai_pricing_schema_1 = require("../schema/ai-pricing-schema");
var pool = new pg_1.Pool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT),
});
var db = (0, node_postgres_1.drizzle)({ client: pool });
// ---------------------------------------------------------------------------
// Seed data (from current MODEL_CONFIGS in ai-operations.ts)
// ---------------------------------------------------------------------------
var MODELS = [
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
var PRICING = {
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
var DEFAULT_MARKUP = 1.0;
var OPERATIONS = [
    { operationType: 'question_generation', label: 'Question Generation', maxInputTokens: 4000, maxOutputTokens: 2000, isCurrentFeature: true },
    { operationType: 'answer_analysis', label: 'Answer Analysis', maxInputTokens: 2000, maxOutputTokens: 1000, isCurrentFeature: true },
    { operationType: 'chunk_enhancement', label: 'Chunk Enhancement', maxInputTokens: 2000, maxOutputTokens: 1000, isCurrentFeature: false },
    { operationType: 'content_generation', label: 'Content Generation', maxInputTokens: 8000, maxOutputTokens: 4000, isCurrentFeature: false },
];
// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, MODELS_1, m, _a, MODELS_2, m, p, _b, MODELS_3, m, _c, OPERATIONS_1, op;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('Seeding AI pricing tables...');
                    _i = 0, MODELS_1 = MODELS;
                    _d.label = 1;
                case 1:
                    if (!(_i < MODELS_1.length)) return [3 /*break*/, 4];
                    m = MODELS_1[_i];
                    return [4 /*yield*/, db
                            .insert(ai_pricing_schema_1.aiModel)
                            .values(m)
                            .onConflictDoNothing()];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("  \u2713 ".concat(MODELS.length, " models"));
                    _a = 0, MODELS_2 = MODELS;
                    _d.label = 5;
                case 5:
                    if (!(_a < MODELS_2.length)) return [3 /*break*/, 8];
                    m = MODELS_2[_a];
                    p = PRICING[m.id];
                    if (!p)
                        return [3 /*break*/, 7];
                    return [4 /*yield*/, db
                            .insert(ai_pricing_schema_1.aiModelPricing)
                            .values({
                            modelId: m.id,
                            inputPricePer1M: p.input,
                            outputPricePer1M: p.output,
                        })
                            .onConflictDoNothing()];
                case 6:
                    _d.sent();
                    _d.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log("  \u2713 ".concat(Object.keys(PRICING).length, " pricing rows"));
                    _b = 0, MODELS_3 = MODELS;
                    _d.label = 9;
                case 9:
                    if (!(_b < MODELS_3.length)) return [3 /*break*/, 12];
                    m = MODELS_3[_b];
                    return [4 /*yield*/, db
                            .insert(ai_pricing_schema_1.aiMarkupConfig)
                            .values({
                            modelId: m.id,
                            markupFactor: DEFAULT_MARKUP,
                            changeReason: 'Initial seed — cost pass-through',
                        })
                            .onConflictDoNothing()];
                case 10:
                    _d.sent();
                    _d.label = 11;
                case 11:
                    _b++;
                    return [3 /*break*/, 9];
                case 12:
                    console.log("  \u2713 ".concat(MODELS.length, " markup rows (factor=").concat(DEFAULT_MARKUP, ")"));
                    _c = 0, OPERATIONS_1 = OPERATIONS;
                    _d.label = 13;
                case 13:
                    if (!(_c < OPERATIONS_1.length)) return [3 /*break*/, 16];
                    op = OPERATIONS_1[_c];
                    return [4 /*yield*/, db
                            .insert(ai_pricing_schema_1.operationConfig)
                            .values(op)
                            .onConflictDoNothing()];
                case 14:
                    _d.sent();
                    _d.label = 15;
                case 15:
                    _c++;
                    return [3 /*break*/, 13];
                case 16:
                    console.log("  \u2713 ".concat(OPERATIONS.length, " operation configs"));
                    console.log('Seed complete.');
                    return [4 /*yield*/, pool.end()];
                case 17:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
seed().catch(function (err) {
    console.error('Seed failed:', err);
    process.exit(1);
});
