import { describe, expect, it } from "vitest";
import { createFormField, updateForm } from "./model";

const baseField = {
  formId: "form-id",
  userId: "user-id",
  category: "input",
  required: false,
};

describe("form field input schemas", () => {
  it("accepts supported strict configurations and rejects type mismatches", () => {
    expect(createFormField.safeParse({
      ...baseField,
      type: "text",
      label: "Name",
      config: { placeholder: "Your name" },
    }).success).toBe(true);
    expect(createFormField.safeParse({
      ...baseField,
      type: "select",
      label: "Color",
      config: { options: ["red", "blue"] },
    }).success).toBe(true);
    expect(createFormField.safeParse({
      ...baseField,
      type: "text",
      label: "Name",
      config: { options: ["red"] },
    }).success).toBe(false);
    expect(createFormField.safeParse({
      ...baseField,
      type: "text",
      label: "Name",
      config: { placeholder: "Name", unsupported: true },
    }).success).toBe(false);
  });

  it("caps labels and requires non-empty trimmed labels", () => {
    expect(createFormField.safeParse({
      ...baseField,
      type: "text",
      label: "   ",
    }).success).toBe(false);
    expect(createFormField.safeParse({
      ...baseField,
      type: "text",
      label: "x".repeat(121),
    }).success).toBe(false);
    expect(updateForm.safeParse({
      formFieldId: "field-id",
      formId: "form-id",
      userId: "user-id",
      label: "x".repeat(121),
    }).success).toBe(false);
  });

  it("validates concurrent schema inputs independently", async () => {
    const results = await Promise.all([
      Promise.resolve().then(() => createFormField.safeParse({
        ...baseField,
        type: "select",
        label: "Valid",
        config: { options: ["one"] },
      })),
      Promise.resolve().then(() => createFormField.safeParse({
        ...baseField,
        type: "select",
        label: "Invalid",
        config: { placeholder: "not options" },
      })),
    ]);

    expect(results.map((result) => result.success)).toEqual([true, false]);
  });
});
