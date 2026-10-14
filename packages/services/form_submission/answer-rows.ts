export function buildSubmissionAnswerRows(
  snapshotFields: Array<{ id: string; fieldKey: string }>,
  draft: Record<string, unknown>,
  currentFields: Array<{ id: string; fieldKey: string }>,
) {
  const currentFieldIds = new Map(currentFields.map((field) => [field.fieldKey, field.id]));
  return snapshotFields.map((field) => ({
    fieldKey: field.fieldKey,
    fieldId: currentFieldIds.get(field.fieldKey) ?? null,
    value: Object.prototype.hasOwnProperty.call(draft, field.id) ? draft[field.id] : null,
  }));
}
