ALTER TABLE "ai_usage_log" RENAME COLUMN "pass_charged" TO "amount_charged_usd";--> statement-breakpoint
ALTER TABLE "pass_balance" RENAME COLUMN "balance" TO "balance_usd";--> statement-breakpoint
ALTER TABLE "pass_transaction" RENAME COLUMN "delta" TO "delta_usd";