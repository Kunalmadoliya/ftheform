CREATE TYPE "public"."status" AS ENUM('filling', 'submitted', 'not_submitted');--> statement-breakpoint
CREATE TABLE "answer" (
	"answer_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"field_key_id" uuid NOT NULL,
	"value" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form" (
	"form_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"user_id" text NOT NULL,
	"description" text,
	"form_url" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "form_form_url_unique" UNIQUE("form_url")
);
--> statement-breakpoint
CREATE TABLE "form_field" (
	"form_field_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"field_key_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"field_order" integer NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_snapshot" (
	"form_snapshot_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"fields_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"submission_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"user_id" text,
	"status" "status" DEFAULT 'filling' NOT NULL,
	"draft_answer" jsonb,
	"allow_multiple_submit" boolean DEFAULT false,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_submission_id_submission_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("submission_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_field_id_form_field_form_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_field"("form_field_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_snapshot" ADD CONSTRAINT "form_snapshot_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_snapshot_id_form_snapshot_form_snapshot_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."form_snapshot"("form_snapshot_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answer_submissionId_idx" ON "answer" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "form_userId_idx" ON "form" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "form_field_idx" ON "form_field" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_snapshot_idx" ON "form_snapshot" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "submission_formId_idx" ON "submission" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "submission_userId_idx" ON "submission" USING btree ("user_id");