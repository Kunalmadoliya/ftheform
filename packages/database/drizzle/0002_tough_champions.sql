ALTER TABLE "form" ALTER COLUMN "title" SET DEFAULT 'Untitled Form';--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "response_limit" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "is_open" boolean DEFAULT true NOT NULL;