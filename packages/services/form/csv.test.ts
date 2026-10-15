import { describe, expect, it } from "vitest";
import { buildFormCsv } from "./csv";

const olderSnapshot = {
  versions: 1,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  fieldsJson: [
    { fieldKey: "renamed-key", label: "Old name", fieldOrder: 0 },
    { fieldKey: "deleted-key", label: "Deleted question", fieldOrder: 1 },
  ],
};

const newerSnapshot = {
  versions: 2,
  createdAt: new Date("2025-02-01T00:00:00.000Z"),
  fieldsJson: [
    { fieldKey: "renamed-key", label: "New name", fieldOrder: 0 },
    { fieldKey: "choices", label: "Options", fieldOrder: 1 },
    { fieldKey: "unsafe", label: "Formula", fieldOrder: 2 },
    { fieldKey: "quote", label: "Quoted text", fieldOrder: 3 },
  ],
};

describe("form response CSV", () => {
  it("unions snapshot field keys, uses the newest labels, and retains deleted fields", () => {
    const result = buildFormCsv([olderSnapshot, newerSnapshot], [], []);
    expect(result.submittedCount).toBe(0);
    expect(result.csv.startsWith("\uFEFF")).toBe(true);
    expect(result.csv).toContain('"New name"');
    expect(result.csv).not.toContain('"Old name"');
    expect(result.csv).toContain('"Deleted question"');
  });

  it("escapes commas, quotes, and newlines, joins multiselect values, and protects formulas", () => {
    const result = buildFormCsv(
      [olderSnapshot, newerSnapshot],
      [{
        id: "submission-1",
        submittedAt: new Date("2025-02-02T03:04:05.000Z"),
        versions: 2,
        respondentName: "Rae, Example",
        respondentEmail: "rae@example.com",
      }],
      [
        { submissionId: "submission-1", fieldKey: "renamed-key", value: "first line,\nsecond \"line\"" },
        { submissionId: "submission-1", fieldKey: "choices", value: ["red", "blue"] },
        { submissionId: "submission-1", fieldKey: "unsafe", value: "=1+1" },
        { submissionId: "submission-1", fieldKey: "quote", value: "-2+3" },
      ],
    );

    expect(result.submittedCount).toBe(1);
    expect(result.csv).toContain('"Rae, Example <rae@example.com>"');
    expect(result.csv).toContain('"first line,\nsecond ""line"""');
    expect(result.csv).toContain('"red; blue"');
    expect(result.csv).toContain("\"'=1+1\"");
    expect(result.csv).toContain("\"'-2+3\"");
  });

  it("exports anonymous respondents and serializes nested object answer values", () => {
    const result = buildFormCsv(
      [{
        versions: 1,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        fieldsJson: [{ fieldKey: "nested", label: "Nested", fieldOrder: 0 }],
      }],
      [{
        id: "anonymous-submission",
        submittedAt: null,
        versions: 1,
        respondentName: null,
        respondentEmail: null,
      }],
      [{ submissionId: "anonymous-submission", fieldKey: "nested", value: { tags: ["one", "two"] } }],
    );

    expect(result.csv).toContain('"Anonymous"');
    expect(result.csv).toContain('"{""tags"":[""one"",""two""]}"');
  });
});
