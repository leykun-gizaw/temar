-- Drop the foreign key constraint on topic.parent_page_id -> user.notion_page_id
ALTER TABLE "topic" DROP CONSTRAINT IF EXISTS "topic_parent_page_id_user_notion_page_id_fk";--> statement-breakpoint

-- Make Notion-specific columns nullable on topic table
ALTER TABLE "topic" ALTER COLUMN "parent_database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "topic" ALTER COLUMN "datasource_id" DROP NOT NULL;--> statement-breakpoint

-- Make Notion-specific columns nullable on note table
ALTER TABLE "note" ALTER COLUMN "parent_database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "datasource_id" DROP NOT NULL;--> statement-breakpoint

-- Make Notion-specific columns nullable on chunk table
ALTER TABLE "chunk" ALTER COLUMN "parent_database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chunk" ALTER COLUMN "datasource_id" DROP NOT NULL;
