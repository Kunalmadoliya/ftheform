import { and, count, db, eq, gte, inArray, lt, sql } from "@repo/database";
import { user } from "@repo/database/auth-schema";
import { form, formField, formGenerationJob } from "@repo/database/models/form-schema";
import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";

import FormFieldService, { MAX_FORM_FIELDS } from "../form_feild";
import { getOpenAiClient } from "./client";
import { formGenerationRequested, inngest } from "./inngest-client";
import { serviceError } from "../errors";
import { env } from "../env";
import { deriveFormLifecycle } from "../form/model";
import {
  formGenerationJobOutput,
  GeneratedFieldsValidationError,
  generatedFieldsSchema,
  getFormGenerationStatusInput,
  normalizeOpenAiGeneratedForm,
  openAiGeneratedFieldsSchema,
  startFormGenerationInput,
  type GeneratedFields,
  type GeneratedFormResult,
  type StartFormGenerationInput,
} from "./model";
import { FORM_GENERATION_SYSTEM_PROMPT } from "./prompts/systemPrompts";
import {
  NonFormRequestError,
  sanitizeGeneratedForm,
  validatePromptInput,
} from "./guardrails";
import {
  CREDIT_EXHAUSTED_MESSAGE,
  DAILY_FREE_GENERATION_QUOTA,
  evaluateGenerationCreditEligibility,
} from "./credits";

const formFields = new FormFieldService();
const dailyGenerationQuota = DAILY_FREE_GENERATION_QUOTA;
const promptRetentionDays = 30;
export const safeGenerationError = "Form generation failed after multiple attempts. Please try again.";

export default class FormAiService {
  public async startGeneration(input: StartFormGenerationInput, userId: string) {
    if (!env.OPENAI_API_KEY) {
      throw serviceError("INTERNAL_SERVER_ERROR", "AI form generation is not configured.");
    }
    const { formId, prompt } = await startFormGenerationInput.parseAsync(input);
    const validatedPrompt = validatePromptInput(prompt, userId);

    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const job = await db.transaction(async (tx) => {
      const [ownedForm] = await tx
        .select({ id: form.id, isPublished: form.isPublished, isArchived: form.isArchived })
        .from(form)
        .where(and(eq(form.id, formId), eq(form.userId, userId)))
        .for("update");
      if (!ownedForm) throw serviceError("NOT_FOUND", "Form not found");
      if (deriveFormLifecycle(ownedForm.isPublished, ownedForm.isArchived) === "archived") {
        throw serviceError("CONFLICT", "Archived forms cannot be changed");
      }

      const lockKeys = [
        `form-generation:form:${formId}`,
        `form-generation:user:${userId}:${dayStart.toISOString().slice(0, 10)}`,
      ].sort();
      for (const key of lockKeys) {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
      }

      const [activeJob] = await tx
        .select({ id: formGenerationJob.id })
        .from(formGenerationJob)
        .where(and(
          eq(formGenerationJob.formId, formId),
          inArray(formGenerationJob.status, ["pending", "running"]),
        ))
        .limit(1);
      if (activeJob) throw serviceError("CONFLICT", "A generation job is already active for this form");

      const [dailyJobs] = await tx
        .select({ count: count() })
        .from(formGenerationJob)
        .where(and(
          eq(formGenerationJob.userId, userId),
          gte(formGenerationJob.createdAt, dayStart),
        ));
      if (!dailyJobs) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to check the daily generation quota");

      let usedCredit = false;
      if (dailyJobs.count < dailyGenerationQuota) {
        usedCredit = false;
      } else {
        const [userData] = await tx
          .select({ credits: user.credits })
          .from(user)
          .where(eq(user.id, userId))
          .for("update");
        const userCredits = userData?.credits ?? 0;

        const [pendingPaidJobs] = await tx
          .select({ count: count() })
          .from(formGenerationJob)
          .where(and(
            eq(formGenerationJob.userId, userId),
            eq(formGenerationJob.usedCredit, true),
            inArray(formGenerationJob.status, ["pending", "running"]),
          ));
        const pendingCount = pendingPaidJobs?.count ?? 0;

        const eligibility = evaluateGenerationCreditEligibility(
          dailyJobs.count,
          userCredits,
          pendingCount,
          dailyGenerationQuota,
        );

        if (!eligibility.allowed) {
          throw serviceError("TOO_MANY_REQUESTS", CREDIT_EXHAUSTED_MESSAGE);
        }
        usedCredit = eligibility.usedCredit;
      }

      const [existingFields] = await tx
        .select({ count: count() })
        .from(formField)
        .where(eq(formField.formId, formId));
      if (!existingFields) throw serviceError("INTERNAL_SERVER_ERROR", "Unable to check the form field limit");
      if (existingFields.count >= MAX_FORM_FIELDS) {
        throw serviceError("TOO_MANY_REQUESTS", "This form has reached its field limit");
      }

      const [createdJob] = await tx
        .insert(formGenerationJob)
        .values({ formId, userId, prompt: validatedPrompt, status: "pending", usedCredit })
        .returning({
          id: formGenerationJob.id,
          formId: formGenerationJob.formId,
          status: formGenerationJob.status,
          error: formGenerationJob.error,
          createdAt: formGenerationJob.createdAt,
          updatedAt: formGenerationJob.updatedAt,
        });
      if (!createdJob) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to create the form generation job");
      return createdJob;
    });

    try {
      await inngest.send(formGenerationRequested.create({ jobId: job.id }));
    } catch {
      await this.markFailed(
        job.id,
        "Unable to queue generation. Check Inngest connectivity and retry.",
      );
      throw serviceError("INTERNAL_SERVER_ERROR", "Unable to start form generation. Check Inngest configuration and retry.");
    }

    return formGenerationJobOutput.parse(job);
  }

  public async getStatus(input: { jobId: string }, userId: string) {
    const { jobId } = await getFormGenerationStatusInput.parseAsync(input);
    const [job] = await db
      .select({
        id: formGenerationJob.id,
        formId: formGenerationJob.formId,
        status: formGenerationJob.status,
        error: formGenerationJob.error,
        createdAt: formGenerationJob.createdAt,
        updatedAt: formGenerationJob.updatedAt,
      })
      .from(formGenerationJob)
      .where(and(eq(formGenerationJob.id, jobId), eq(formGenerationJob.userId, userId)));
    if (!job) throw serviceError("NOT_FOUND", "Form generation job not found");
    return formGenerationJobOutput.parse(job);
  }

  public async getJobForProcessing(jobId: string) {
    const [job] = await db
      .select()
      .from(formGenerationJob)
      .where(eq(formGenerationJob.id, jobId));
    return job;
  }

  public async markRunning(jobId: string) {
    const [updatedJob] = await db
      .update(formGenerationJob)
      .set({ status: "running", error: null })
      .where(and(eq(formGenerationJob.id, jobId), eq(formGenerationJob.status, "pending")))
      .returning({ status: formGenerationJob.status });
    if (updatedJob) return updatedJob.status;

    const [currentJob] = await db
      .select({ status: formGenerationJob.status })
      .from(formGenerationJob)
      .where(eq(formGenerationJob.id, jobId));
    if (currentJob?.status === "running" || currentJob?.status === "completed") {
      return currentJob.status;
    }
    throw serviceError("CONFLICT", "Form generation job cannot be started");
  }

  public async generateFields(prompt: string): Promise<GeneratedFormResult> {
    let response;
    try {
      response = await getOpenAiClient().responses.parse({
        model: env.OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: FORM_GENERATION_SYSTEM_PROMPT,
          },
          { role: "user", content: prompt },
        ],
        text: {
          format: zodTextFormat(openAiGeneratedFieldsSchema, "generated_form_fields"),
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new GeneratedFieldsValidationError(
          "The AI returned malformed structured form fields",
        );
      }
      throw error;
    }
    if (!response.output_parsed) {
      throw new GeneratedFieldsValidationError("The AI returned no structured form fields");
    }
    const normalized = normalizeOpenAiGeneratedForm(response.output_parsed);
    if (
      !normalized.fields ||
      normalized.fields.length === 0 ||
      normalized.title === "Invalid Form Request"
    ) {
      throw new NonFormRequestError("I can only help create forms. Please describe the form you want.");
    }
    return sanitizeGeneratedForm(normalized);
  }

  public async completeGeneration(
    jobId: string,
    result: GeneratedFormResult | GeneratedFields,
  ) {
    const rawResult: GeneratedFormResult = Array.isArray(result)
      ? { fields: result }
      : result;

    if (
      !rawResult.fields ||
      rawResult.fields.length === 0 ||
      rawResult.title === "Invalid Form Request"
    ) {
      throw new NonFormRequestError("I can only help create forms. Please describe the form you want.");
    }

    const sanitized = sanitizeGeneratedForm(rawResult);
    const validatedFields = generatedFieldsSchema.parse(sanitized.fields);
    const title = sanitized.title;
    const description = sanitized.description;

    return db.transaction(async (tx) => {
      const [jobReference] = await tx
        .select({ formId: formGenerationJob.formId })
        .from(formGenerationJob)
        .where(eq(formGenerationJob.id, jobId));
      if (!jobReference) return undefined;

      const [generationForm] = await tx
        .select({
          id: form.id,
          title: form.title,
          description: form.description,
          isPublished: form.isPublished,
          isArchived: form.isArchived,
        })
        .from(form)
        .where(eq(form.id, jobReference.formId))
        .for("update");
      if (!generationForm) return undefined;

      const [job] = await tx
        .select()
        .from(formGenerationJob)
        .where(eq(formGenerationJob.id, jobId))
        .for("update");
      if (!job) return undefined;
      if (job.status === "completed") return job;
      if (job.status === "failed") throw serviceError("CONFLICT", "Form generation job has failed");
      if (deriveFormLifecycle(generationForm.isPublished, generationForm.isArchived) === "archived") {
        const [failedJob] = await tx
          .update(formGenerationJob)
          .set({ status: "failed", error: "Archived forms cannot be changed" })
          .where(eq(formGenerationJob.id, jobId))
          .returning();
        return failedJob;
      }

      await formFields.createGeneratedFieldsInTransaction(
        tx,
        job.formId,
        job.userId,
        validatedFields,
      );

      const isDefaultTitle = generationForm.title === "Untitled Form";
      const isDescriptionEmpty = !generationForm.description || !generationForm.description.trim();

      const formUpdates: { title?: string; description?: string } = {};
      if (title && isDefaultTitle) {
        formUpdates.title = title;
      }
      if (description && isDescriptionEmpty) {
        formUpdates.description = description;
      }
      if (Object.keys(formUpdates).length > 0) {
        await tx.update(form).set(formUpdates).where(eq(form.id, job.formId));
      }

      if (job.usedCredit) {
        await tx
          .update(user)
          .set({
            credits: sql`GREATEST(0, ${user.credits} - 1)`,
          })
          .where(eq(user.id, job.userId));
      }

      const [completedJob] = await tx
        .update(formGenerationJob)
        .set({ status: "completed", error: null })
        .where(eq(formGenerationJob.id, jobId))
        .returning();
      if (!completedJob) throw serviceError("INTERNAL_SERVER_ERROR", "Failed to complete form generation job");
      return completedJob;
    });
  }

  public async markFailed(jobId: string, message = safeGenerationError) {
    await db
      .update(formGenerationJob)
      .set({ status: "failed", error: message })
      .where(
        and(
          eq(formGenerationJob.id, jobId),
          inArray(formGenerationJob.status, ["pending", "running"]),
        ),
      );
  }

  public async failStaleJobs() {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    const failedJobs = await db
      .update(formGenerationJob)
      .set({ status: "failed", error: "Generation timed out. You can safely try again." })
      .where(and(
        inArray(formGenerationJob.status, ["pending", "running"]),
        lt(formGenerationJob.updatedAt, cutoff),
      ))
      .returning({ id: formGenerationJob.id });
    return { count: failedJobs.length };
  }

  public async clearExpiredPrompts() {
    const cutoff = new Date(Date.now() - promptRetentionDays * 24 * 60 * 60 * 1000);
    const expiredPrompts = await db
      .update(formGenerationJob)
      .set({ prompt: "" })
      .where(and(lt(formGenerationJob.createdAt, cutoff), sql`${formGenerationJob.prompt} <> ''`))
      .returning({ id: formGenerationJob.id });
    return { count: expiredPrompts.length };
  }
}

export const formAiServiceInstance = new FormAiService();