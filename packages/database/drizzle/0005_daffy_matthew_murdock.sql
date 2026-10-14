WITH ranked_answers AS (
  SELECT
    "answer_id",
    row_number() OVER (
      PARTITION BY "submission_id", "field_key_id"
      ORDER BY "created_at" DESC, "answer_id" DESC
    ) AS duplicate_rank
  FROM "answer"
)
DELETE FROM "answer" AS target
USING ranked_answers
WHERE target."answer_id" = ranked_answers."answer_id"
  AND ranked_answers.duplicate_rank > 1;--> statement-breakpoint
WITH ranked_snapshots AS (
  SELECT
    "form_snapshot_id",
    first_value("form_snapshot_id") OVER (
      PARTITION BY "form_id", "form_versions"
      ORDER BY "created_at" DESC, "form_snapshot_id" DESC
    ) AS keeper_id,
    row_number() OVER (
      PARTITION BY "form_id", "form_versions"
      ORDER BY "created_at" DESC, "form_snapshot_id" DESC
    ) AS duplicate_rank
  FROM "form_snapshot"
)
UPDATE "submission" AS target
SET "snapshot_id" = ranked_snapshots.keeper_id
FROM ranked_snapshots
WHERE target."snapshot_id" = ranked_snapshots."form_snapshot_id"
  AND ranked_snapshots.duplicate_rank > 1;--> statement-breakpoint
WITH ranked_snapshots AS (
  SELECT
    "form_snapshot_id",
    row_number() OVER (
      PARTITION BY "form_id", "form_versions"
      ORDER BY "created_at" DESC, "form_snapshot_id" DESC
    ) AS duplicate_rank
  FROM "form_snapshot"
)
DELETE FROM "form_snapshot" AS target
USING ranked_snapshots
WHERE target."form_snapshot_id" = ranked_snapshots."form_snapshot_id"
  AND ranked_snapshots.duplicate_rank > 1;--> statement-breakpoint
WITH ranked_user_drafts AS (
  SELECT
    "submission_id",
    row_number() OVER (
      PARTITION BY "form_id", "user_id"
      ORDER BY "last_activity" DESC, "started_at" DESC, "submission_id" DESC
    ) AS duplicate_rank
  FROM "submission"
  WHERE "status" = 'filling' AND "user_id" IS NOT NULL
)
UPDATE "submission" AS target
SET "status" = 'not_submitted'
FROM ranked_user_drafts
WHERE target."submission_id" = ranked_user_drafts."submission_id"
  AND ranked_user_drafts.duplicate_rank > 1;--> statement-breakpoint
WITH ranked_respondent_drafts AS (
  SELECT
    "submission_id",
    row_number() OVER (
      PARTITION BY "form_id", "respondent_id"
      ORDER BY "last_activity" DESC, "started_at" DESC, "submission_id" DESC
    ) AS duplicate_rank
  FROM "submission"
  WHERE "status" = 'filling' AND "respondent_id" IS NOT NULL
)
UPDATE "submission" AS target
SET "status" = 'not_submitted'
FROM ranked_respondent_drafts
WHERE target."submission_id" = ranked_respondent_drafts."submission_id"
  AND ranked_respondent_drafts.duplicate_rank > 1;--> statement-breakpoint
ALTER TYPE "status" RENAME TO "submission_status";--> statement-breakpoint
DROP INDEX "form_snapshot_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "answer_submission_field_key_unique_idx" ON "answer" USING btree ("submission_id","field_key_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_snapshot_form_version_unique_idx" ON "form_snapshot" USING btree ("form_id","form_versions");--> statement-breakpoint
CREATE INDEX "submission_snapshot_idx" ON "submission" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "submission_form_status_idx" ON "submission" USING btree ("form_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_filling_form_user_unique_idx" ON "submission" USING btree ("form_id","user_id") WHERE "submission"."status" = 'filling' AND "submission"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_filling_form_respondent_unique_idx" ON "submission" USING btree ("form_id","respondent_id") WHERE "submission"."status" = 'filling' AND "submission"."respondent_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" DROP COLUMN "allow_multiple_submit";