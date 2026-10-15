import { describe, expect, it } from "vitest";
import { deriveFormLifecycle, requireDeleteConfirmation } from "./model";

/**
 * Lifecycle guard behaviours
 * These are pure-function tests covering the logical rules the spec requires
 * for lifecycle derivation, archive/restore semantics, and deletion guard.
 * DB-layer integration tests (concurrent delete, archive-blocks-route) require
 * a live database and are tracked separately in PROGRESS.md.
 */

describe("lifecycle derivation", () => {
  it("archived is always archived regardless of isPublished", () => {
    // Archive must not depend on publish state
    expect(deriveFormLifecycle(true, true)).toBe("archived");
    expect(deriveFormLifecycle(false, true)).toBe("archived");
  });

  it("restoring by flipping only isArchived: published form becomes live, unpublished becomes draft", () => {
    // After restore (isArchived = false), isPublished is untouched
    expect(deriveFormLifecycle(true, false)).toBe("live");   // was published → live
    expect(deriveFormLifecycle(false, false)).toBe("draft"); // was unpublished → draft
  });

  it("archive preserves publication state: live form archived is still 'archived', draft form archived is still 'archived'", () => {
    // Publication state is irrelevant when archived — both become "archived"
    expect(deriveFormLifecycle(true, true)).toBe("archived");
    expect(deriveFormLifecycle(false, true)).toBe("archived");
    // Confirming that publication state does NOT bleed through
    const archivedLive = deriveFormLifecycle(true, true);
    const archivedDraft = deriveFormLifecycle(false, true);
    expect(archivedLive).toBe(archivedDraft);
  });

  it("exhaustive: all four (isPublished, isArchived) combinations map to the correct lifecycle", () => {
    const cases: [boolean, boolean, "live" | "draft" | "archived"][] = [
      [false, false, "draft"],
      [true, false, "live"],
      [false, true, "archived"],
      [true, true, "archived"],
    ];
    for (const [isPublished, isArchived, expected] of cases) {
      expect(deriveFormLifecycle(isPublished, isArchived)).toBe(expected);
    }
  });
});

describe("permanent-delete confirmation guard", () => {
  it("zero submitted responses: deletes without any confirmation fields", () => {
    expect(() => requireDeleteConfirmation(0, undefined, undefined)).not.toThrow();
    expect(() => requireDeleteConfirmation(0, false, undefined)).not.toThrow();
    expect(() => requireDeleteConfirmation(0, true, 99)).not.toThrow();
  });

  it("with responses: requires both confirmDeleteResponses=true and exact expectedSubmittedCount", () => {
    // Missing both
    expect(() => requireDeleteConfirmation(5, undefined, undefined)).toThrow();
    // confirmDeleteResponses false
    expect(() => requireDeleteConfirmation(5, false, 5)).toThrow();
    // Wrong expected count
    expect(() => requireDeleteConfirmation(5, true, 4)).toThrow();
    expect(() => requireDeleteConfirmation(5, true, 6)).toThrow();
    // Correct
    expect(() => requireDeleteConfirmation(5, true, 5)).not.toThrow();
  });

  it("expectedSubmittedCount must match exactly — off by one is rejected (CONFLICT)", () => {
    expect(() => requireDeleteConfirmation(10, true, 9)).toThrow();
    expect(() => requireDeleteConfirmation(10, true, 11)).toThrow();
    expect(() => requireDeleteConfirmation(10, true, 10)).not.toThrow();
  });

  it("confirmDeleteResponses=true without expectedSubmittedCount is rejected", () => {
    expect(() => requireDeleteConfirmation(3, true, undefined)).toThrow();
  });
});

describe("archived-form public-route guard (assertPublicFormAvailable logic)", () => {
  /**
   * These tests verify the logic that assertPublicFormAvailable in
   * form_submission/index.ts uses. It throws NOT_FOUND when:
   *   - ownerId is null (soft-deleted user), OR
   *   - deriveFormLifecycle(...) === "archived"
   * We test the lifecycle derivation side here (the ownerId side is trivially null-check).
   */

  function assertPublicFormAvailable(isPublished: boolean, isArchived: boolean, ownerId: string | null) {
    if (!ownerId || deriveFormLifecycle(isPublished, isArchived) === "archived") {
      throw new Error("Form no longer available");
    }
  }

  it("blocks access to an archived published form", () => {
    expect(() => assertPublicFormAvailable(true, true, "user-id")).toThrow("Form no longer available");
  });

  it("blocks access to an archived unpublished form", () => {
    expect(() => assertPublicFormAvailable(false, true, "user-id")).toThrow("Form no longer available");
  });

  it("blocks access when owner is null (deleted user)", () => {
    expect(() => assertPublicFormAvailable(true, false, null)).toThrow("Form no longer available");
  });

  it("allows access to a live form with a valid owner", () => {
    expect(() => assertPublicFormAvailable(true, false, "user-id")).not.toThrow();
  });

  it("allows access to a draft form for owner inspection (form exists, not archived)", () => {
    // Draft forms are not public but the guard itself only checks archived + ownerId;
    // the isPublished check is a separate concern (FORBIDDEN, not NOT_FOUND)
    expect(() => assertPublicFormAvailable(false, false, "user-id")).not.toThrow();
  });
});
