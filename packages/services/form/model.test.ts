import { describe, expect, it } from "vitest";
import { createInitialForm, renameForm, updateFormDescription } from "./model";

describe("form text input limits", () => {
  it("requires non-empty titles and caps titles and descriptions", () => {
    expect(createInitialForm.safeParse({ userId: "user", title: "  " }).success).toBe(false);
    expect(createInitialForm.safeParse({ userId: "user", title: "x".repeat(201) }).success).toBe(false);
    expect(createInitialForm.safeParse({ userId: "user", title: "Form", description: "x".repeat(2001) }).success).toBe(false);
    expect(renameForm.safeParse({
      formId: "form",
      userId: "user",
      title: "x".repeat(201),
    }).success).toBe(false);
    expect(updateFormDescription.safeParse({
      formId: "form",
      userId: "user",
      description: "x".repeat(2001),
    }).success).toBe(false);
  });

  it("validates title inputs concurrently", async () => {
    const values = await Promise.all([
      Promise.resolve().then(() => renameForm.safeParse({
        formId: "form",
        userId: "user",
        title: "Short title",
      })),
      Promise.resolve().then(() => renameForm.safeParse({
        formId: "form",
        userId: "user",
        title: "x".repeat(201),
      })),
    ]);

    expect(values.map((value) => value.success)).toEqual([true, false]);
  });
});
