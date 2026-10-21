ALTER TYPE "public"."lang" ADD VALUE 'uk';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'pt';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'zh';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'pa';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'tl';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'ar';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'hi';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'ru';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'it';--> statement-breakpoint
ALTER TYPE "public"."lang" ADD VALUE 'fa';--> statement-breakpoint
ALTER TABLE "language_level" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "language_level" ADD COLUMN "position" smallint NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "language_level_user_position_idx" ON "language_level" USING btree ("user_id","position");--> statement-breakpoint
ALTER TABLE "language_level" ADD CONSTRAINT "language_level_position_range" CHECK ("language_level"."position" between 0 and 2);