"use client";

import { useMemo, useState } from "react";
import { IconChevronDown, IconChevronUp } from "~/components/icons/app-icons";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
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

  function fieldLabel(fieldId: string | null, fieldKey: string) {
    const fields = snapshotQuery.data?.fieldsJson;
    if (!Array.isArray(fields)) return `Field ${fieldId ?? fieldKey}`;
    const field = fields.find(
      (item) =>
        item &&
        typeof item === "object" &&
        "fieldKey" in item &&
        item.fieldKey === fieldKey &&
        "label" in item &&
        typeof item.label === "string",
    );
    return field && typeof field === "object" && "label" in field && typeof field.label === "string"
      ? field.label
      : `Field ${fieldId}`;
  }

  const isLoading = formsQuery.isPending || responseData.isPending;

  return (
    <section className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Inbox</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Responses</h1>
        <p className="mt-1 text-xs text-muted-foreground">Aggregated submissions across all your forms.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl border border-border" />
          <Skeleton className="h-16 w-full rounded-2xl border border-border" />
          <Skeleton className="h-16 w-full rounded-2xl border border-border" />
        </div>
      ) : null}

      {(formsQuery.isError || responseData.isError) && !isLoading ? (
        <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 font-mono text-xs text-destructive" role="alert">
          Unable to load responses.
        </p>
      ) : null}

      {!isLoading && submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-mono text-xs text-muted-foreground">There are no submitted responses yet.</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {submissions.map(({ form, submission }) => {
          const isExpanded = expandedId === submission.id;
          return (
            <Card key={submission.id} className="rounded-2xl border-border bg-card shadow-none">
              <CardHeader className="flex-row items-center justify-between gap-4 p-5">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">{form.title}</CardTitle>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Submitted {new Date(submission.submittedAt ?? submission.startedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse answers" : "Expand answers"}
                  onClick={() => setExpandedId(isExpanded ? undefined : submission.id)}
                >
                  {isExpanded ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
                </button>
              </CardHeader>
              {isExpanded ? (
                <CardContent className="border-t border-border p-5">
                  {answersData.isPending || snapshotQuery.isPending ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : null}
                  {answersData.isError || snapshotQuery.isError ? (
                    <p className="font-mono text-xs text-destructive" role="alert">
                      Unable to load this response.
                    </p>
                  ) : null}
                  {!answersData.isPending && answers.length === 0 ? (
                    <p className="font-mono text-xs text-muted-foreground">No answers were recorded.</p>
                  ) : null}
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {answers.map((answer) => (
                      <div key={answer.id} className="rounded-xl border border-border bg-muted/10 p-3.5 space-y-1">
                        <dt className="font-mono text-xs text-muted-foreground">
                          {fieldLabel(answer.fieldId, answer.fieldKey)}
                        </dt>
                        <dd className="break-words font-sans text-sm text-foreground">
                          {displayValue(answer.value)}
                        </dd>
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
