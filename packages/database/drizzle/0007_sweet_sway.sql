WITH ranked_active_jobs AS (
  SELECT
    "form_generation_job_id",
    row_number() OVER (
      PARTITION BY "form_id"
      ORDER BY "updated_at" DESC, "created_at" DESC, "form_generation_job_id" DESC
    ) AS duplicate_rank
  FROM "form_generation_job"
  WHERE "status" IN ('pending', 'running')
)
UPDATE "form_generation_job" AS target
SET
  "status" = 'failed',
  "error" = 'Superseded by a newer active generation job.'
FROM ranked_active_jobs
WHERE target."form_generation_job_id" = ranked_active_jobs."form_generation_job_id"
  AND ranked_active_jobs.duplicate_rank > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "form_generation_job_one_active_per_form_idx" ON "form_generation_job" USING btree ("form_id") WHERE "form_generation_job"."status" IN ('pending', 'running');