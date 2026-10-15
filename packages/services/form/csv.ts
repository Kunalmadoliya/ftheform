import { z } from "zod";

const snapshotFieldSchema = z.object({
  fieldKey: z.string(),
  label: z.string(),
  fieldOrder: z.number().optional(),
});

export type FormCsvSnapshot = {
  versions: number;
  createdAt: Date;
  fieldsJson: unknown;
};

export type FormCsvSubmission = {
  id: string;
  submittedAt: Date | null;
  versions: number;
  respondentName: string | null;
  respondentEmail: string | null;
};

export type FormCsvAnswer = {
  submissionId: string;
  fieldKey: string;
  value: unknown;
};

function csvCell(value: unknown) {
  let text: string;
  if (value === null || value === undefined) text = "";
  else if (Array.isArray(value)) text = value.map(String).join("; ");
  else if (typeof value === "object") text = JSON.stringify(value);
  else text = String(value);

  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildFormCsv(
  snapshots: FormCsvSnapshot[],
  submissions: FormCsvSubmission[],
  answers: FormCsvAnswer[],
) {
  const fieldsByKey = new Map<string, string>();
  const newestFirst = [...snapshots].sort(
    (left, right) =>
      right.versions - left.versions ||
      right.createdAt.getTime() - left.createdAt.getTime(),
  );

  for (const snapshot of newestFirst) {
    const parsedFields = z.array(snapshotFieldSchema).safeParse(snapshot.fieldsJson);
    if (!parsedFields.success) throw new Error("Form snapshot fields are invalid");
    const orderedFields = [...parsedFields.data].sort(
      (left, right) => (left.fieldOrder ?? 0) - (right.fieldOrder ?? 0),
    );
    for (const field of orderedFields) {
      if (!fieldsByKey.has(field.fieldKey)) fieldsByKey.set(field.fieldKey, field.label);
    }
  }

  const answersBySubmission = new Map<string, Map<string, unknown>>();
  for (const answer of answers) {
    let submissionAnswers = answersBySubmission.get(answer.submissionId);
    if (!submissionAnswers) {
      submissionAnswers = new Map();
      answersBySubmission.set(answer.submissionId, submissionAnswers);
    }
    submissionAnswers.set(answer.fieldKey, answer.value);
  }

  const headers = ["Submission ID", "Submitted At", "Form Version", "Respondent", ...fieldsByKey.values()];
  const rows = submissions.map((submission) => {
    const respondent =
      submission.respondentName && submission.respondentEmail
        ? `${submission.respondentName} <${submission.respondentEmail}>`
        : submission.respondentEmail ?? submission.respondentName ?? "Anonymous";
    const submissionAnswers = answersBySubmission.get(submission.id);
    return [
      submission.id,
      submission.submittedAt?.toISOString() ?? "",
      submission.versions,
      respondent,
      ...[...fieldsByKey.keys()].map((fieldKey) => submissionAnswers?.get(fieldKey)),
    ];
  });

  return {
    csv: `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`,
    submittedCount: submissions.length,
  };
}
