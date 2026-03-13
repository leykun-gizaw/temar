ALTER TYPE "public"."chunk_tracking_status" ADD VALUE 'untracked';--> statement-breakpoint
CREATE TABLE "question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"rubric" jsonb,
	"generation_batch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "max_question_reviews" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "recall_item" ADD COLUMN "retired_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chunk" ADD COLUMN "content_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_chunk_id_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunk"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_item" DROP COLUMN "elapsed_days";