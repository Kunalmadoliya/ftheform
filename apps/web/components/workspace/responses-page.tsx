"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  useAnswersForSubmissions,
  useSubmissionsAcrossForms,
} from "~/hooks/form/use-submissions-across-forms";
import { trpc } from "~/trpc/client";

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function ResponsesPage() {
  const formsQuery = trpc.form.listFormsByUser.useQuery();
  const forms = formsQuery.data ?? [];
  const responseData = useSubmissionsAcrossForms(forms.map(({ id, title }) => ({ id, title })));
  const submissions = useMemo(
    () =>
      responseData.entries
        .flatMap(({ form, submissions: items }) =>
          items.map((submission) => ({ form, submission })),
        )
        .sort(
          (a, b) =>
            new Date(b.submission.submittedAt ?? b.submission.startedAt).getTime() -
            new Date(a.submission.submittedAt ?? a.submission.startedAt).getTime(),
        ),
    [responseData.entries],
  );
  const [expandedId, setExpandedId] = useState<string>();
  const expanded = submissions.find(({ submission }) => submission.id === expandedId);
  const answersData = useAnswersForSubmissions(expanded ? [expanded.submission.id] : []);
  const answers = expanded ? answersData.answersBySubmission.get(expanded.submission.id) ?? [] : [];
  const snapshotQuery = trpc.formSnapshot.getSnapshotById.useQuery(
    {
      formId: expanded?.form.id ?? "",
      formSnapshotId: expanded?.submission.snapshotId ?? "",
    },
    { enabled: Boolean(expanded), retry: false },
  );

  function fieldLabel(fieldId: string) {
    const fields = snapshotQuery.data?.fieldsJson;
    if (!Array.isArray(fields)) return `Field ${fieldId}`;
    const field = fields.find(
      (item) =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        item.id === fieldId &&
        "label" in item &&
        typeof item.label === "string",
    );
    return field && typeof field === "object" && "label" in field && typeof field.label === "string"
      ? field.label
      : `Field ${fieldId}`;
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Responses from all your forms</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Responses</h1>
      </div>
      {formsQuery.isPending || responseData.isPending ? (
        <p className="text-sm text-muted-foreground">Loading responses...</p>
      ) : null}
      {formsQuery.isError || responseData.isError ? (
        <p className="text-sm text-destructive" role="alert">Unable to load responses.</p>
      ) : null}
      {!formsQuery.isPending && !responseData.isPending && submissions.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          There are no submitted responses yet.
        </p>
      ) : null}
      <div className="space-y-3">
        {submissions.map(({ form, submission }) => {
          const isExpanded = expandedId === submission.id;
          return (
            <Card key={submission.id}>
              <CardHeader className="flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{form.title}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {new Date(submission.submittedAt ?? submission.startedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 hover:bg-muted"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse answers" : "Expand answers"}
                  onClick={() => setExpandedId(isExpanded ? undefined : submission.id)}
                >
                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              </CardHeader>
              {isExpanded ? (
                <CardContent className="border-t pt-4">
                  {answersData.isPending || snapshotQuery.isPending ? (
                    <p className="text-sm text-muted-foreground">Loading answers...</p>
                  ) : null}
                  {answersData.isError || snapshotQuery.isError ? (
                    <p className="text-sm text-destructive" role="alert">Unable to load this response.</p>
                  ) : null}
                  {!answersData.isPending && answers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No answers were recorded.</p>
                  ) : null}
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {answers.map((answer) => (
                      <div key={answer.id} className="space-y-1">
                        <dt className="text-xs font-medium text-muted-foreground">
                          {fieldLabel(answer.fieldId)}
                        </dt>
                        <dd className="break-words text-sm">{displayValue(answer.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
