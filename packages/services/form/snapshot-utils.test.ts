import { describe, expect, it } from "vitest";
import { fieldSetHash, migrateDraftAnswers } from "./snapshot-utils";

describe("snapshot utilities", () => {
  it("migrates draft entries by fieldKey and drops removed fields", () => {
    const migrated = migrateDraftAnswers(
      [
        { id: "old-name", fieldKey: "stable-name" },
        { id: "old-removed", fieldKey: "stable-removed" },
      ],
      [{ id: "new-name", fieldKey: "stable-name" }],
      { "old-name": "kept", "old-removed": "dropped", unknown: "dropped" },
    );

    expect(migrated).toEqual({ "new-name": "kept" });
  });

  it("hashes equivalent field sets consistently and detects changes", () => {
    const first = [{
      id: "id-1",
      fieldKey: "key-1",
      type: "text",
      category: "input",
      label: "Name",
      required: true,
      fieldOrder: 0,
      config: { placeholder: "Your name", maxLength: 100 },
      updatedAt: "ignored metadata",
    }];
    const same = [{
      updatedAt: "new metadata",
      config: { maxLength: 100, placeholder: "Your name" },
      fieldOrder: 0,
      required: true,
      label: "Name",
      category: "input",
      type: "text",
      fieldKey: "key-1",
      id: "id-1",
    }];

    expect(fieldSetHash(first)).toBe(fieldSetHash(same));
    expect(fieldSetHash([{ ...first[0], label: "Updated name" }])).not.toBe(fieldSetHash(first));
  });

  it("handles concurrent snapshot migrations deterministically", async () => {
    const inputs = [
      { "old-name": "first" },
      { "old-name": "second" },
    ];
    const results = await Promise.all(inputs.map((draft) =>
      Promise.resolve().then(() =>
        migrateDraftAnswers(
          [{ id: "old-name", fieldKey: "name" }],
          [{ id: "new-name", fieldKey: "name" }],
          draft,
        ),
      ),
    ));

    expect(results).toEqual([{ "new-name": "first" }, { "new-name": "second" }]);
  });
});
