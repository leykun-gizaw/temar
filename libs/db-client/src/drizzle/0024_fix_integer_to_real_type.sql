-- Migration 0023 renamed pass_charged → amount_charged_usd, balance → balance_usd,
-- and delta → delta_usd but did NOT change the column type from integer to real.
-- The Drizzle schema declares these as real, so inserts of float values fail with:
--   "invalid input syntax for type integer"
-- This migration fixes the column types to match the Drizzle schema.

ALTER TABLE "ai_usage_log" ALTER COLUMN "amount_charged_usd" TYPE real USING "amount_charged_usd"::real;--> statement-breakpoint
ALTER TABLE "pass_balance" ALTER COLUMN "balance_usd" TYPE real USING "balance_usd"::real;--> statement-breakpoint
ALTER TABLE "pass_transaction" ALTER COLUMN "delta_usd" TYPE real USING "delta_usd"::real;
