ALTER TABLE "translation_usage" ADD COLUMN "action" text DEFAULT 'translation' NOT NULL;--> statement-breakpoint
ALTER TABLE "translation_usage" ADD COLUMN "cost" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "translation_usage" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "translation_usage" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "translation_usage" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "translation_usage" ADD CONSTRAINT "translation_usage_cost_positive" CHECK ("translation_usage"."cost" > 0);