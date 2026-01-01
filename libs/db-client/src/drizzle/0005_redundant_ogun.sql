ALTER TABLE "chunk" DROP CONSTRAINT "chunk_note_id_note_id_fk";
--> statement-breakpoint
ALTER TABLE "note" DROP CONSTRAINT "note_topic_id_topic_id_fk";
--> statement-breakpoint
ALTER TABLE "chunk" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "topic" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_note_id_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic" ADD CONSTRAINT "topic_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;