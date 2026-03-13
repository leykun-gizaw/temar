CREATE TABLE "recall_item_archive" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chunk_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"question_title" text,
	"question_text" text,
	"answer_rubric" jsonb,
	"state" smallint NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"stability" real NOT NULL,
	"difficulty" real NOT NULL,
	"scheduled_days" integer NOT NULL,
	"reps" integer NOT NULL,
	"lapses" integer NOT NULL,
	"learning_steps" integer NOT NULL,
	"last_review" timestamp with time zone,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generation_batch_id" uuid,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DROP TABLE "question" CASCADE;--> statement-breakpoint
ALTER TABLE "recall_item_archive" ADD CONSTRAINT "recall_item_archive_chunk_id_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunk"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_item_archive" ADD CONSTRAINT "recall_item_archive_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_item" DROP COLUMN "retired_at";