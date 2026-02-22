CREATE TYPE "public"."chunk_tracking_status" AS ENUM('pending', 'generating', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "chunk_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "chunk_tracking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chunk_tracking_chunk_user_idx" UNIQUE("chunk_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "recall_item" DROP CONSTRAINT "recall_item_chunk_user_idx";--> statement-breakpoint
ALTER TABLE "recall_item" ADD COLUMN "generation_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "review_log" ADD COLUMN "answer_json" jsonb;--> statement-breakpoint
ALTER TABLE "chunk_tracking" ADD CONSTRAINT "chunk_tracking_chunk_id_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunk"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunk_tracking" ADD CONSTRAINT "chunk_tracking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;