CREATE TYPE "public"."field_type" AS ENUM('text', 'email', 'number', 'select', 'radio', 'checkbox', 'textarea', 'date', 'file');--> statement-breakpoint
CREATE TABLE "forms_feilds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(255) NOT NULL,
	"labelKey" varchar NOT NULL,
	"description" text,
	"feild_type" "field_type" NOT NULL,
	"placeholder" varchar(255),
	"is_required" boolean DEFAULT false,
	"index" numeric NOT NULL,
	"form_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "forms_feilds_form_id_index_unique" UNIQUE("form_id","index")
);
--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "forms_feilds" ADD CONSTRAINT "forms_feilds_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;