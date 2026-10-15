import { describe, expect, it } from "vitest";
import {
  createInitialForm,
  deriveFormLifecycle,
  requireDeleteConfirmation,
  renameForm,
  updateFormDescription,
} from "./model";

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

  describe("form lifecycle and deletion confirmation", () => {
    it("derives live, draft, and archived states without changing publication state", () => {
      expect(deriveFormLifecycle(true, false)).toBe("live");
      expect(deriveFormLifecycle(false, false)).toBe("draft");
      expect(deriveFormLifecycle(true, true)).toBe("archived");
      expect(deriveFormLifecycle(false, true)).toBe("archived");
    });

    it("requires explicit confirmation with the exact submitted-response count", () => {
      expect(() => requireDeleteConfirmation(0, undefined, undefined)).not.toThrow();
      expect(() => requireDeleteConfirmation(3, undefined, undefined)).toThrow();
      expect(() => requireDeleteConfirmation(3, true, 2)).toThrow();
      expect(() => requireDeleteConfirmation(3, true, 3)).not.toThrow();
    });
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
