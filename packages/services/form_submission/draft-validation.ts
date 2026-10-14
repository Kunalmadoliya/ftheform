import { z } from "zod";
import { serviceError } from "../errors";

export const MAX_DRAFT_ANSWER_BYTES = 64 * 1024;
export const MAX_ANSWER_STRING_LENGTH = 10_000;

const snapshotFieldSchema = z.object({
  id: z.string(),
  fieldKey: z.string(),
  type: z.string(),
  required: z.boolean(),
  config: z.unknown().optional(),
});

function issue(message: string, path: (string | number)[] = []) {
  return new z.ZodError([{ code: "custom", message, path }]);
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === "" ||
    (Array.isArray(value) && value.length === 0);
}

function configRecord(config: unknown) {
  return config && typeof config === "object" && !Array.isArray(config)
    ? config as Record<string, unknown>
    : {};
}

function buildSnapshotFieldValidator(
  field: z.infer<typeof snapshotFieldSchema>,
  requireRequired: boolean,
) {
  const config = configRecord(field.config);
  return z.unknown().superRefine((value, context) => {
    if (isEmpty(value)) {
      if (requireRequired && field.required) {
        context.addIssue({ code: "custom", message: "This field is required" });
      }
      return;
    }

    const reject = (message: string) => context.addIssue({ code: "custom", message });
    switch (field.type) {
      case "text":
      case "textarea":
        if (typeof value !== "string") return reject("Expected text");
        if (value.length > MAX_ANSWER_STRING_LENGTH) return reject("Text is too long");
        if (requireRequired && field.required && value.trim().length === 0) {
          return reject("This field is required");
        }
        return;
      case "email":
        if (typeof value !== "string" || value.length > MAX_ANSWER_STRING_LENGTH ||
          !z.email().safeParse(value).success) {
          return reject("Enter a valid email address");
        }
        if (requireRequired && field.required && value.trim().length === 0) {
          return reject("This field is required");
        }
        return;
      case "number": {
        if (typeof value !== "number" || !Number.isFinite(value)) return reject("Expected a number");
        if (typeof config.min === "number" && value < config.min) return reject("Number is below the minimum");
        if (typeof config.max === "number" && value > config.max) return reject("Number exceeds the maximum");
        return;
      }
      case "select": {
        const options = config.options;
        if (!Array.isArray(options) || options.some((option) => typeof option !== "string")) {
          return reject("Select options are invalid");
        }
        if (typeof value !== "string" || !options.includes(value)) {
          return reject("Select a valid option");
        }
        return;
      }
      case "multiselect": {
        const options = config.options;
        if (!Array.isArray(options) || options.some((option) => typeof option !== "string")) {
          return reject("Multiselect options are invalid");
        }
        if (!Array.isArray(value) || value.some((option) => typeof option !== "string" || !options.includes(option))) {
          return reject("Select only valid options");
        }
        return;
      }
      case "rating": {
        const maxStars = typeof config.maxStars === "number" ? config.maxStars : 5;
        if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maxStars) {
          return reject(`Rating must be an integer from 1 to ${maxStars}`);
        }
        return;
      }
      case "date": {
        if (typeof value !== "string" || !z.iso.date().safeParse(value).success) {
          return reject("Enter a valid date");
        }
        if (typeof config.minDate === "string" && value < config.minDate) {
          return reject("Date is before the minimum");
        }
        if (typeof config.maxDate === "string" && value > config.maxDate) {
          return reject("Date is after the maximum");
        }
        return;
      }
      case "checkbox":
        if (typeof value !== "boolean" || (requireRequired && field.required && value !== true)) {
          return reject("Check this box to continue");
        }
        return;
      default:
        return reject("Unsupported field type");
    }
  });
}

export function validateSnapshotDraft(
  fieldsJson: unknown,
  draftAnswer: unknown,
  options: { requireRequired: boolean },
) {
  const parsedFields = z.array(snapshotFieldSchema).safeParse(fieldsJson);
  if (!parsedFields.success) {
    throw serviceError("INTERNAL_SERVER_ERROR", "Form snapshot fields are invalid");
  }
  if (draftAnswer !== null && draftAnswer !== undefined &&
    (typeof draftAnswer !== "object" || Array.isArray(draftAnswer))) {
    throw issue("Draft answers must be an object");
  }

  const draft = draftAnswer && typeof draftAnswer === "object"
    ? draftAnswer as Record<string, unknown>
    : {};
  const fieldsById = new Map(parsedFields.data.map((field) => [field.id, field]));
  for (const fieldId of Object.keys(draft)) {
    if (!fieldsById.has(fieldId)) throw issue("Draft contains an invalid field", [fieldId]);
  }

  const payloadSize = Buffer.byteLength(JSON.stringify(draft), "utf8");
  if (payloadSize > MAX_DRAFT_ANSWER_BYTES) {
    throw issue(`Draft answers exceed the ${MAX_DRAFT_ANSWER_BYTES}-byte limit`);
  }

  for (const field of parsedFields.data) {
    const result = buildSnapshotFieldValidator(field, options.requireRequired).safeParse(draft[field.id]);
    if (!result.success) {
      throw new z.ZodError(
        result.error.issues.map((validationIssue) => ({
          ...validationIssue,
          path: [field.id, ...validationIssue.path],
        })),
      );
    }
  }

  return { fields: parsedFields.data, draft };
}
