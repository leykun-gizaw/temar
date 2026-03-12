ALTER TABLE "user" DROP CONSTRAINT "user_stripe_customer_id_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "paddle_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "paddle_subscription_id" text;--> statement-breakpoint
ALTER TABLE "pass_transaction" ADD COLUMN "paddle_transaction_id" text;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "stripe_plan";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "stripe_subscription_id";--> statement-breakpoint
ALTER TABLE "pass_transaction" DROP COLUMN "stripe_payment_intent_id";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_paddle_customer_id_unique" UNIQUE("paddle_customer_id");