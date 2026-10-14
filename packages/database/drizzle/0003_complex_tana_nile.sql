ALTER TABLE "answer" DROP CONSTRAINT "answer_field_id_form_field_form_field_id_fk";
--> statement-breakpoint
ALTER TABLE "form" DROP CONSTRAINT "form_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "form_snapshot" DROP CONSTRAINT "form_snapshot_form_id_form_form_id_fk";
--> statement-breakpoint
ALTER TABLE "submission" DROP CONSTRAINT "submission_form_id_form_form_id_fk";
--> statement-breakpoint
ALTER TABLE "submission" DROP CONSTRAINT "submission_snapshot_id_form_snapshot_form_snapshot_id_fk";
--> statement-breakpoint
ALTER TABLE "submission" DROP CONSTRAINT "submission_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "answer" ALTER COLUMN "field_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_field_id_form_field_form_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_field"("form_field_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_snapshot" ADD CONSTRAINT "form_snapshot_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_form_id_form_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("form_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_snapshot_id_form_snapshot_form_snapshot_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."form_snapshot"("form_snapshot_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.archive_forms_before_user_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.form
  SET is_archived = true, is_published = false, is_open = false
  WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER archive_forms_before_user_delete
BEFORE DELETE ON public."user"
FOR EACH ROW
EXECUTE FUNCTION public.archive_forms_before_user_delete();