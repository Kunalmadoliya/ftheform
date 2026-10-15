import { describe, expect, it } from "vitest";
import {
  GeneratedFieldsValidationError,
  generatedFieldsSchema,
  normalizeOpenAiGeneratedFields,
} from "./model";
import { createFormField } from "../form_feild/model";

const emptyConfig = {
  options: null,
  maxStars: null,
  placeholder: null,
  min: null,
  max: null,
  minDate: null,
  maxDate: null,
};

function field(type: string, label: string, config: Record<string, unknown> = {}) {
  return {
    type,
    category: "input",
    label,
    required: false,
    config: { ...emptyConfig, ...config },
  };
}

describe("normalizeOpenAiGeneratedFields", () => {
  it("preserves each field type's supported config shape", () => {
    const normalized = normalizeOpenAiGeneratedFields({
      fields: [
        field("text", "Name", { placeholder: "Your name" }),
        field("textarea", "Comments", { placeholder: "Write a response" }),
        field("email", "Email", { placeholder: "name@example.com" }),
        field("number", "Age", { min: 18, max: 99 }),
        field("select", "Color", { options: ["red", "blue"] }),
        field("multiselect", "Interests", { options: ["art", "music"] }),
        field("checkbox", "Consent"),
        field("rating", "Satisfaction", { maxStars: 5 }),
        field("date", "Appointment", { minDate: "2026-01-01", maxDate: "2026-12-31" }),
      ],
    });

    expect(normalized).toEqual([
      {
        type: "text",
        category: "input",
        label: "Name",
        required: false,
        config: { placeholder: "Your name" },
      },
      {
        type: "textarea",
        category: "input",
        label: "Comments",
        required: false,
        config: { placeholder: "Write a response" },
      },
      {
        type: "email",
        category: "input",
        label: "Email",
        required: false,
        config: { placeholder: "name@example.com" },
      },
      {
        type: "number",
        category: "input",
        label: "Age",
        required: false,
        config: { min: 18, max: 99 },
      },
      {
        type: "select",
        category: "input",
        label: "Color",
        required: false,
        config: { options: ["red", "blue"] },
      },
      {
        type: "multiselect",
        category: "input",
        label: "Interests",
        required: false,
        config: { options: ["art", "music"] },
      },
      { type: "checkbox", category: "input", label: "Consent", required: false },
      {
        type: "rating",
        category: "input",
        label: "Satisfaction",
        required: false,
        config: { maxStars: 5 },
      },
      {
        type: "date",
        category: "input",
        label: "Appointment",
        required: false,
        config: { minDate: "2026-01-01", maxDate: "2026-12-31" },
      },
    ]);

    const databaseJsonRoundTrip = generatedFieldsSchema.parse(
      JSON.parse(JSON.stringify(normalized)),
    );
    const numberField = databaseJsonRoundTrip[3];
    const selectField = databaseJsonRoundTrip[4];
    expect(numberField?.config).toEqual({ min: 18, max: 99 });
    expect(selectField?.config).toEqual({ options: ["red", "blue"] });
    if (selectField?.type === "select") {
      expect(Array.isArray(selectField.config.options)).toBe(true);
    }
    expect(
      normalized.map(
        (generatedField) =>
          createFormField.safeParse({
            formId: "form-id",
            userId: "user-id",
            ...generatedField,
          }).success,
      ),
    ).toEqual(Array(9).fill(true));
  });

  it("rejects unrelated non-null config values with the field type and key", () => {
    expect(() =>
      normalizeOpenAiGeneratedFields({
        fields: [field("number", "Age", { min: 18, placeholder: "Age in years" })],
      }),
    ).toThrow("unsupported configuration for number: placeholder");
  });

  it("rejects malformed config values instead of coercing their shape", () => {
    expect(() =>
      normalizeOpenAiGeneratedFields({
        fields: [field("number", "Age", { min: ["min", "max"] })],
      }),
    ).toThrow(GeneratedFieldsValidationError);
  });

  it("rejects configurations that fail the supported field schema", () => {
    expect(() =>
      normalizeOpenAiGeneratedFields({
        fields: [field("number", "Age", { min: 99, max: 18 })],
      }),
    ).toThrow("Minimum cannot exceed maximum");
  });
});
