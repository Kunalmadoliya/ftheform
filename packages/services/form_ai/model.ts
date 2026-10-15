import { z } from "zod";

const placeholderConfig = z
  .object({ placeholder: z.string().trim().max(200).optional() })
  .strict()
  .optional();

const selectConfig = z
  .object({
    options: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  })
  .strict()
  .superRefine((config, context) => {
    if (new Set(config.options).size !== config.options.length) {
      context.addIssue({ code: "custom", message: "Options must be unique", path: ["options"] });
    }
  });

const numberConfig = z
  .object({ min: z.number().optional(), max: z.number().optional() })
  .strict()
  .superRefine((config, context) => {
    if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
      context.addIssue({ code: "custom", message: "Minimum cannot exceed maximum", path: ["min"] });
    }
  })
  .optional();

const dateConfig = z
  .object({
    minDate: z.iso.date().optional(),
    maxDate: z.iso.date().optional(),
  })
  .strict()
  .superRefine((config, context) => {
    if (config.minDate && config.maxDate && config.minDate > config.maxDate) {
      context.addIssue({
        code: "custom",
        message: "Minimum date cannot exceed maximum date",
        path: ["minDate"],
      });
    }
  })
  .optional();

const fieldProperties = {
  category: z.literal("input"),
  label: z.string().trim().min(1).max(120),
  required: z.boolean(),
};

export const generatedFieldConfigSchema = z.discriminatedUnion("type", [
  z.strictObject({ ...fieldProperties, type: z.literal("text"), config: placeholderConfig }),
  z.strictObject({ ...fieldProperties, type: z.literal("textarea"), config: placeholderConfig }),
  z.strictObject({ ...fieldProperties, type: z.literal("email"), config: placeholderConfig }),
  z.strictObject({ ...fieldProperties, type: z.literal("number"), config: numberConfig }),
  z.strictObject({ ...fieldProperties, type: z.literal("select"), config: selectConfig }),
  z.strictObject({ ...fieldProperties, type: z.literal("multiselect"), config: selectConfig }),
  z.strictObject({
    ...fieldProperties,
    type: z.literal("checkbox"),
    config: z.strictObject({}).optional(),
  }),
  z.strictObject({
    ...fieldProperties,
    type: z.literal("rating"),
    config: z.strictObject({ maxStars: z.number().int().min(1).max(10) }),
  }),
  z.strictObject({ ...fieldProperties, type: z.literal("date"), config: dateConfig }),
]);

export const generatedFieldSchema = generatedFieldConfigSchema;

export const generatedFieldsSchema = z.array(generatedFieldSchema).min(1).max(20);

const structuredFieldConfigSchema = z.strictObject({
  options: z.array(z.string()).nullable(),
  maxStars: z.number().int().nullable(),
  placeholder: z.string().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  minDate: z.string().nullable(),
  maxDate: z.string().nullable(),
});

export const openAiGeneratedFieldsSchema = z.strictObject({
  fields: z
    .array(
      z.strictObject({
        type: z.enum([
          "text",
          "textarea",
          "email",
          "number",
          "select",
          "multiselect",
          "checkbox",
          "rating",
          "date",
        ]),
        category: z.literal("input"),
        label: z.string(),
        required: z.boolean(),
        config: structuredFieldConfigSchema,
      }),
    )
    .min(1)
    .max(20),
});

type OpenAiGeneratedField = z.infer<typeof openAiGeneratedFieldsSchema>["fields"][number];
type GeneratedConfigKey = keyof OpenAiGeneratedField["config"];

const configKeysByType: Record<OpenAiGeneratedField["type"], GeneratedConfigKey[]> = {
  text: ["placeholder"],
  textarea: ["placeholder"],
  email: ["placeholder"],
  number: ["min", "max"],
  select: ["options"],
  multiselect: ["options"],
  checkbox: [],
  rating: ["maxStars"],
  date: ["minDate", "maxDate"],
};

export class GeneratedFieldsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeneratedFieldsValidationError";
  }
}

export function normalizeOpenAiGeneratedFields(response: unknown): GeneratedFields {
  const parsedResponse = openAiGeneratedFieldsSchema.safeParse(response);
  if (!parsedResponse.success) {
    const issues = parsedResponse.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new GeneratedFieldsValidationError(
      `The AI returned malformed structured form fields: ${issues}`,
    );
  }

  const fields = parsedResponse.data.fields.map((field) => {
    const allowedKeys = configKeysByType[field.type];
    const unsupportedKeys = Object.entries(field.config)
      .filter(
        ([key, value]) =>
          value !== null && !allowedKeys.some((allowedKey) => allowedKey === key),
      )
      .map(([key]) => key);
    if (unsupportedKeys.length > 0) {
      throw new GeneratedFieldsValidationError(
        `The AI returned unsupported configuration for ${field.type}: ${unsupportedKeys.join(", ")}`,
      );
    }

    const config = Object.fromEntries(
      allowedKeys.flatMap((key) => {
        const value = field.config[key];
        return value === null ? [] : [[key, value]];
      }),
    );
    return {
      type: field.type,
      category: field.category,
      label: field.label,
      required: field.required,
      ...(Object.keys(config).length > 0 ? { config } : {}),
    };
  });

  const validatedFields = generatedFieldsSchema.safeParse(fields);
  if (!validatedFields.success) {
    const issues = validatedFields.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new GeneratedFieldsValidationError(
      `The AI returned invalid field configuration: ${issues}`,
    );
  }
  return validatedFields.data;
}

export const startFormGenerationInput = z.strictObject({
  formId: z.string().uuid(),
  prompt: z.string().trim().min(8).max(2000),
});

export const getFormGenerationStatusInput = z.strictObject({
  jobId: z.string().uuid(),
});

export const formGenerationJobOutput = z.strictObject({
  id: z.string(),
  formId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const formGenerationStatusOutput = formGenerationJobOutput;

export type GeneratedFormField = z.infer<typeof generatedFieldSchema>;
export type GeneratedFields = z.infer<typeof generatedFieldsSchema>;
export type StartFormGenerationInput = z.infer<typeof startFormGenerationInput>;