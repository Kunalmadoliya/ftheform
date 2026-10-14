CREATE TYPE "public"."form_generation_job_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "form_generation_job" (
	"form_generation_job_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"prompt" text NOT NULL,
	"status" "form_generation_job_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_generation_job" ADD CONSTRAINT "form_generation_job_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_generation_job" ADD CONSTRAINT "form_generation_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_generation_job_form_idx" ON "form_generation_job" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_generation_job_user_idx" ON "form_generation_job" USING btree ("user_id");