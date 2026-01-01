CREATE TABLE "chunk" (
	"id" uuid PRIMARY KEY NOT NULL,
	"note_id" uuid,
	"parent_database_id" uuid NOT NULL,
	"datasource_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"content_json" jsonb,
	"content_markdown" text
);
--> statement-breakpoint
CREATE TABLE "note" (
	"id" uuid PRIMARY KEY NOT NULL,
	"topic_id" uuid,
	"parent_database_id" uuid NOT NULL,
	"datasource_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parent_page_id" uuid,
	"parent_database_id" uuid NOT NULL,
	"datasource_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_note_id_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."note"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic" ADD CONSTRAINT "topic_parent_page_id_user_notion_page_id_fk" FOREIGN KEY ("parent_page_id") REFERENCES "public"."user"("notion_page_id") ON DELETE no action ON UPDATE no action;