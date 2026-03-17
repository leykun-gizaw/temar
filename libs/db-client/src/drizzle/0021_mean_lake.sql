CREATE TABLE "ai_markup_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"markup_factor" real DEFAULT 1 NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"change_reason" text
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_model_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"input_price_per_1m" real NOT NULL,
	"output_price_per_1m" real NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"change_reason" text
);
--> statement-breakpoint
CREATE TABLE "ai_usage_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"operation_type" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"input_price_per_1m_snapshot" real NOT NULL,
	"output_price_per_1m_snapshot" real NOT NULL,
	"markup_factor_snapshot" real NOT NULL,
	"computed_cost_usd" real NOT NULL,
	"pass_charged" integer NOT NULL,
	"is_byok" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operation_configs" (
	"operation_type" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"max_input_tokens" integer NOT NULL,
	"max_output_tokens" integer NOT NULL,
	"is_current_feature" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_markup_config" ADD CONSTRAINT "ai_markup_config_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_pricing" ADD CONSTRAINT "ai_model_pricing_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_operation_type_operation_configs_operation_type_fk" FOREIGN KEY ("operation_type") REFERENCES "public"."operation_configs"("operation_type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_markup_model_idx" ON "ai_markup_config" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "ai_markup_active_idx" ON "ai_markup_config" USING btree ("model_id","effective_to");--> statement-breakpoint
CREATE INDEX "ai_model_pricing_model_idx" ON "ai_model_pricing" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "ai_model_pricing_active_idx" ON "ai_model_pricing" USING btree ("model_id","effective_to");--> statement-breakpoint
CREATE INDEX "ai_usage_log_user_idx" ON "ai_usage_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_log_model_idx" ON "ai_usage_log" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "ai_usage_log_created_idx" ON "ai_usage_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_log_user_created_idx" ON "ai_usage_log" USING btree ("user_id","created_at");