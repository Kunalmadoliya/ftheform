import { createHash } from "node:crypto";
import { z } from "zod";

const snapshotIdentityFields = z.array(
  z.object({ id: z.string(), fieldKey: z.string() }).passthrough(),
);

export function migrateDraftAnswers(
  oldFieldsJson: unknown,
  newFieldsJson: unknown,
  draftAnswer: unknown,
) {
  const oldFields = snapshotIdentityFields.safeParse(oldFieldsJson);
  const newFields = snapshotIdentityFields.safeParse(newFieldsJson);
  if (!oldFields.success || !newFields.success) {
    throw new Error("Form snapshot fields are invalid");
  }

  const oldFieldKeys = new Map(oldFields.data.map((field) => [field.id, field.fieldKey]));
  const newFieldIds = new Map(newFields.data.map((field) => [field.fieldKey, field.id]));
  const draft = draftAnswer && typeof draftAnswer === "object" && !Array.isArray(draftAnswer)
    ? draftAnswer as Record<string, unknown>
    : {};
  return Object.fromEntries(
    Object.entries(draft).flatMap(([oldFieldId, value]) => {
      const fieldKey = oldFieldKeys.get(oldFieldId);
      const newFieldId = fieldKey ? newFieldIds.get(fieldKey) : undefined;
      return newFieldId ? [[newFieldId, value]] : [];
    }),
  );
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, stableValue(nestedValue)]),
    );
  }
  return value;
}

export function fieldSetHash(fields: unknown) {
  if (!Array.isArray(fields)) return null;
  const normalized = fields.map((field) => {
    if (!field || typeof field !== "object") return null;
    const value = field as Record<string, unknown>;
    return stableValue({
      id: value.id,
      fieldKey: value.fieldKey,
      type: value.type,
      category: value.category,
      label: value.label,
      required: value.required,
      fieldOrder: value.fieldOrder,
      config: value.config,
    });
  });
  if (normalized.some((field) => field === null)) return null;
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
