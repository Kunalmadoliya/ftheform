import { describe, expect, it } from "vitest";
import { buildSubmissionAnswerRows } from "./answer-rows";

describe("submission answer rows", () => {
  it("creates one row per snapshot field and resolves current ids by fieldKey", () => {
    const rows = buildSubmissionAnswerRows(
      [
        { id: "snapshot-name", fieldKey: "key-name" },
        { id: "snapshot-deleted", fieldKey: "key-deleted" },
      ],
      { "snapshot-name": "Ada" },
      [{ id: "current-name", fieldKey: "key-name" }],
    );

    expect(rows).toEqual([
      { fieldKey: "key-name", fieldId: "current-name", value: "Ada" },
      { fieldKey: "key-deleted", fieldId: null, value: null },
    ]);
    expect(new Set(rows.map((row) => row.fieldKey)).size).toBe(rows.length);
  });

  it("keeps concurrent answer-row construction isolated", async () => {
    const builds = ["first", "second"].map((value) =>
      Promise.resolve().then(() =>
        buildSubmissionAnswerRows(
          [{ id: "snapshot-name", fieldKey: "key-name" }],
          { "snapshot-name": value },
          [{ id: "current-name", fieldKey: "key-name" }],
        ),
      ),
    );

    await expect(Promise.all(builds)).resolves.toEqual([
      [{ fieldKey: "key-name", fieldId: "current-name", value: "first" }],
      [{ fieldKey: "key-name", fieldId: "current-name", value: "second" }],
    ]);
  });
});
