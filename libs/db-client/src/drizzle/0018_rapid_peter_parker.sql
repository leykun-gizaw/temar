CREATE TABLE "pass_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pass_balance_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pass_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"operation_type" text NOT NULL,
	"description" text NOT NULL,
	"stripe_payment_intent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "topic" DROP CONSTRAINT "topic_parent_page_id_user_notion_page_id_fk";
--> statement-breakpoint
ALTER TABLE "chunk" ALTER COLUMN "parent_database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chunk" ALTER COLUMN "datasource_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "parent_database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "datasource_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "topic" ALTER COLUMN "parent_database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "topic" ALTER COLUMN "datasource_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pass_reset_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recall_item" ADD COLUMN "question_type" text;--> statement-breakpoint
ALTER TABLE "review_log" ADD COLUMN "analysis_json" jsonb;--> statement-breakpoint
ALTER TABLE "pass_balance" ADD CONSTRAINT "pass_balance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pass_transaction" ADD CONSTRAINT "pass_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pass_balance_userId_idx" ON "pass_balance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pass_transaction_userId_idx" ON "pass_transaction" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id");