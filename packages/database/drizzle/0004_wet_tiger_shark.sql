CREATE TABLE "form_view" (
	"form_view_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"respondent_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_view" ADD CONSTRAINT "form_view_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "form_view_form_respondent_idx" ON "form_view" USING btree ("form_id","respondent_id");