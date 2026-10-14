CREATE TYPE "public"."form_access_policy" AS ENUM('anonymous_and_authenticated', 'anonymous_only', 'authenticated_only');--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "access_policy" "form_access_policy" DEFAULT 'anonymous_and_authenticated' NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "allow_multiple_submissions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "respondent_id" text;--> statement-breakpoint
CREATE INDEX "submission_respondentId_idx" ON "submission" USING btree ("respondent_id");