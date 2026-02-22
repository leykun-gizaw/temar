ALTER TABLE "chunk_tracking" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "chunk_tracking" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chunk_tracking" ADD COLUMN "last_attempt_at" timestamp with time zone;