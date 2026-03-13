ALTER TABLE "user" ADD COLUMN "notion_access_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notion_refresh_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notion_bot_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notion_workspace_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notion_token_expires_at" timestamp;