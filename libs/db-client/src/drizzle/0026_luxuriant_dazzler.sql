ALTER TABLE "user" RENAME COLUMN "paddle_customer_id" TO "provider_customer_id";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "paddle_subscription_id" TO "provider_subscription_id";--> statement-breakpoint
ALTER TABLE "pass_transaction" RENAME COLUMN "paddle_transaction_id" TO "provider_transaction_id";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_paddle_customer_id_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "provider_key" text DEFAULT 'paddle';