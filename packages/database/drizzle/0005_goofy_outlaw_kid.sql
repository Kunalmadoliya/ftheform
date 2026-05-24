ALTER TABLE "forms" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "form_link" text NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "limit" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "expire" timestamp;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_form_link_unique" UNIQUE("form_link");