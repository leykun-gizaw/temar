ALTER TABLE "recall_item" ADD COLUMN "question_type" text;--> statement-breakpoint
ALTER TABLE "review_log" ADD COLUMN "analysis_json" jsonb;
