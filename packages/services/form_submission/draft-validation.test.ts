import { describe, expect, it } from "vitest";
import { MAX_ANSWER_STRING_LENGTH, validateSnapshotDraft } from "./draft-validation";

function validateField(
  type: string,
  value: unknown,
  config: unknown = {},
  required = false,
  requireRequired = true,
) {
  return validateSnapshotDraft(
    [{ id: "field-id", fieldKey: "field-key", type, config, required }],
    { "field-id": value },
    { requireRequired },
  );
}

describe("snapshot draft validation", () => {
  it("validates all supported field types and configured bounds", () => {
    expect(() => validateField("email", "not-an-email")).toThrow();
    expect(() => validateField("email", "ada@example.test")).not.toThrow();
    expect(() => validateField("number", 4, { min: 5, max: 10 })).toThrow();
    expect(() => validateField("number", 11, { min: 5, max: 10 })).toThrow();
    expect(() => validateField("number", 7, { min: 5, max: 10 })).not.toThrow();
    expect(() => validateField("select", "other", { options: ["one", "two"] })).toThrow();
    expect(() => validateField("select", "one", { options: ["one", "two"] })).not.toThrow();
    expect(() => validateField("multiselect", ["one", "other"], { options: ["one", "two"] })).toThrow();
    expect(() => validateField("multiselect", ["one", "two"], { options: ["one", "two"] })).not.toThrow();
    expect(() => validateField("rating", 2.5, { maxStars: 5 })).toThrow();
    expect(() => validateField("rating", 6, { maxStars: 5 })).toThrow();
    expect(() => validateField("rating", 4, { maxStars: 5 })).not.toThrow();
    expect(() => validateField("date", "2026-01-01", { minDate: "2026-02-01" })).toThrow();
    expect(() => validateField("date", "2026-03-01", { maxDate: "2026-02-28" })).toThrow();
    expect(() => validateField("date", "2026-02-20", {
      minDate: "2026-02-01",
      maxDate: "2026-02-28",
    })).not.toThrow();
  });

  it("requires trimmed non-empty text and caps string length", () => {
    expect(() => validateField("text", "   ", {}, true)).toThrow();
    expect(() => validateField("textarea", "   ", {}, true)).toThrow();
    expect(() => validateField("text", "answer", {}, true)).not.toThrow();
    expect(() => validateField("text", "x".repeat(MAX_ANSWER_STRING_LENGTH + 1))).toThrow();
    expect(() => validateField("checkbox", false, {}, true)).toThrow();
    expect(() => validateField("checkbox", true, {}, true)).not.toThrow();
  });

  it("allows partial drafts but rejects unknown field IDs and oversized payloads", () => {
    const fields = [{ id: "field-id", fieldKey: "field-key", type: "text", required: true }];

    expect(() => validateSnapshotDraft(fields, {}, { requireRequired: false })).not.toThrow();
    expect(() => validateSnapshotDraft(fields, {}, { requireRequired: true })).toThrow();
    expect(() => validateSnapshotDraft(fields, { unknown: "answer" }, { requireRequired: false })).toThrow();
    expect(() => validateSnapshotDraft(
      fields,
      { "field-id": "x".repeat(70 * 1024) },
      { requireRequired: false },
    )).toThrow();
  });

  it("validates parallel draft payloads independently", async () => {
    const results = await Promise.allSettled([
      Promise.resolve().then(() => validateField("number", 3, { min: 1, max: 5 })),
      Promise.resolve().then(() => validateField("number", 8, { min: 1, max: 5 })),
    ]);

    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected"]);
  });
});
