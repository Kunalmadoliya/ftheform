"use client";

import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { StatCard } from "~/components/dashboard/stat-card";
import { useFormResponses } from "~/hooks/form/use-form-responses";
import { useFormSnapshots } from "~/hooks/form/use-form-snapshots";
import { useAnswersForSubmissions } from "~/hooks/form/use-submissions-across-forms";
import { trpc } from "~/trpc/client";

type SnapshotField = {
  id: string;
  type: string;
  label: string;
  config?: unknown;
};

function getSnapshotFields(value: unknown): SnapshotField[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (field): field is SnapshotField =>
      Boolean(field) &&
      typeof field === "object" &&
      "id" in field &&
      typeof field.id === "string" &&
      "type" in field &&
      typeof field.type === "string" &&
      "label" in field &&
      typeof field.label === "string",
  );
}

function getOptions(config: unknown) {
  if (!config || typeof config !== "object" || Array.isArray(config)) return [];
  const options = (config as { options?: unknown }).options;
  return Array.isArray(options)
    ? options.filter((option): option is string => typeof option === "string")
    : [];
}

function ChoiceDistribution({
  field,
  values,
}: {
  field: SnapshotField;
  values: unknown[];
}) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const selected = Array.isArray(value) ? value : [value];
    for (const item of selected) {
      if (item === null || item === undefined || item === "") continue;
      const key = String(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const options = [...new Set([...getOptions(field.config), ...counts.keys()])];
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{field.label}</h4>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">No answers recorded yet.</p>
      ) : (
        options.map((option) => {
          const count = counts.get(option) ?? 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={option} className="space-y-1">
              <div className="flex justify-between gap-4 text-xs">
                <span className="truncate">{option}</span>
                <span className="shrink-0 text-muted-foreground">{count} · {percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function FormAnalyticsCard({
  form,
}: {
  form: { id: string; title: string; views: number };
}) {
  const { submissions, submissionsQuery } = useFormResponses(form.id);
  const answersQuery = useAnswersForSubmissions(submissions.map(({ id }) => id));
  const snapshotsQuery = useFormSnapshots(form.id);
  const latestSnapshotFields = useMemo(() => {
    const fieldsById = new Map<string, SnapshotField>();
    const snapshots = [...(snapshotsQuery.data ?? [])].sort((a, b) => a.versions - b.versions);
    for (const snapshot of snapshots) {
      for (const field of getSnapshotFields(snapshot.fieldsJson)) fieldsById.set(field.id, field);
    }
    return [...fieldsById.values()];
  }, [snapshotsQuery.data]);
  const choiceFields = latestSnapshotFields.filter(
    (field) => field.type === "select" || field.type === "multiselect",
  );
  const timeline = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (13 - index));
      const key = day.toLocaleDateString();
      const count = submissions.filter(
        (submission) =>
          submission.submittedAt &&
          new Date(submission.submittedAt).toLocaleDateString() === key,
      ).length;
      return { key, label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count };
    });
  }, [submissions]);
  const maxTimelineCount = Math.max(1, ...timeline.map(({ count }) => count));
  const responseRate = form.views > 0 ? Math.round((submissions.length / form.views) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        <CardDescription>Performance and response details for this form.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-7">
        {submissionsQuery.isError || snapshotsQuery.isError || answersQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            Unable to load analytics for this form.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Views" value={String(form.views)} detail="Recorded form views" />
          <StatCard label="Submissions" value={String(submissions.length)} detail="Completed responses" />
          <StatCard label="Response rate" value={`${responseRate}%`} detail="Submissions per view" />
        </div>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Submissions over the last 14 days</h3>
          <div className="flex h-36 items-end gap-1 border-b pb-1">
            {timeline.map((day) => (
              <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-sm bg-primary/80"
                  style={{ height: `${Math.max(day.count > 0 ? 8 : 0, (day.count / maxTimelineCount) * 100)}%` }}
                  title={`${day.label}: ${day.count}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{timeline[0]?.label}</span>
            <span>{timeline.at(-1)?.label}</span>
          </div>
        </section>
        {choiceFields.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-2">
            {choiceFields.map((field) => (
              <ChoiceDistribution
                key={field.id}
                field={field}
                values={submissions.flatMap(
                  ({ id }) => answersQuery.answersBySubmission.get(id) ?? [],
                ).filter((answer) => answer.fieldId === field.id).map((answer) => answer.value)}
              />
            ))}
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">
            Choice-field distributions will appear when this form has select fields.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const formsQuery = trpc.form.listFormsByUser.useQuery();
  const forms = formsQuery.data ?? [];
  const totalViews = forms.reduce((sum, form) => sum + form.views, 0);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Form performance at a glance</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Analytics</h1>
      </div>
      {formsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading analytics...</p> : null}
      {formsQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">Unable to load analytics.</p>
      ) : null}
      {!formsQuery.isPending && forms.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Create a form to start seeing analytics.
        </p>
      ) : null}
      {forms.length > 0 ? (
        <>
          <StatCard label="Forms tracked" value={String(forms.length)} detail={`${totalViews} recorded views`} />
          <div className="space-y-4">
            {forms.map((form) => (
              <FormAnalyticsCard key={form.id} form={form} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
