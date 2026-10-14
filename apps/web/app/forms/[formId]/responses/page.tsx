"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { useFormResponses } from "~/hooks/form/use-form-responses";
import { useFormSnapshotById } from "~/hooks/form/use-form-snapshots";
import { authClient } from "~/lib/auth-client";
import { toast } from "sonner";

function formatAnswer(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value) ?? String(value);
}

export default function ResponsesPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>();
  const {
    submissions,
    submissionsQuery,
    answers,
    answersQuery,
    deleteSubmissionAsync,
    isDeletingSubmission,
  } = useFormResponses(formId, selectedSubmissionId);
  const selectedSubmission = submissions.find((item) => item.id === selectedSubmissionId);
  const snapshotQuery = useFormSnapshotById(formId, selectedSubmission?.snapshotId);

  useEffect(() => {
    if (!isSessionPending && !session?.user) router.replace("/login");
  }, [isSessionPending, router, session]);

  useEffect(() => {
    if (!selectedSubmissionId && submissions.length > 0) {
      setSelectedSubmissionId(submissions[0]!.id);
    }
    if (selectedSubmissionId && !submissions.some((item) => item.id === selectedSubmissionId)) {
      setSelectedSubmissionId(submissions[0]?.id);
    }
  }, [selectedSubmissionId, submissions]);

  async function deleteSelectedResponse() {
    if (!selectedSubmissionId || !window.confirm("Delete this response? This cannot be undone.")) return;
    try {
      await deleteSubmissionAsync({ submissionId: selectedSubmissionId });
      setSelectedSubmissionId(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete this response.");
    }
  }

  if (isSessionPending || !session?.user) return null;

  function getFieldLabel(fieldId: string) {
    const fields = snapshotQuery.data?.fieldsJson;
    if (!Array.isArray(fields)) return `Field ${fieldId}`;
    const field = fields.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        "id" in candidate &&
        candidate.id === fieldId &&
        "label" in candidate &&
        typeof candidate.label === "string",
    );
    return field && typeof field === "object" && "label" in field && typeof field.label === "string"
      ? field.label
      : `Field ${fieldId}`;
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 p-6 lg:grid-cols-[20rem_1fr] lg:p-10">
      <Card className="h-fit">
        <CardHeader>
          <h1 className="text-xl font-semibold">Responses</h1>
          <p className="text-sm text-muted-foreground">{submissions.length} submitted</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {submissionsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading responses...</p> : null}
          {submissionsQuery.isError ? <p className="text-sm text-destructive" role="alert">Unable to load responses.</p> : null}
          {!submissionsQuery.isPending && !submissionsQuery.isError && submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">There are no submitted responses yet.</p>
          ) : null}
          {submissions.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelectedSubmissionId(item.id)}
              className={`w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted ${
                selectedSubmissionId === item.id ? "border-primary bg-muted" : ""
              }`}
            >
              <span className="block font-medium">Response {item.id.slice(0, 8)}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {new Date(item.submittedAt ?? item.startedAt).toLocaleString()}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="min-h-80">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Response details</h2>
            {selectedSubmission ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted {new Date(selectedSubmission.submittedAt ?? selectedSubmission.startedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          {selectedSubmission ? (
            <Button variant="destructive" size="sm" onClick={() => void deleteSelectedResponse()} disabled={isDeletingSubmission}>
              Delete response
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {!selectedSubmission ? <p className="text-sm text-muted-foreground">Select a response to view its answers.</p> : null}
          {answersQuery.isPending && selectedSubmission ? <p className="text-sm text-muted-foreground">Loading answers...</p> : null}
          {answersQuery.isError ? <p className="text-sm text-destructive" role="alert">Unable to load this response.</p> : null}
          {selectedSubmission && !answersQuery.isPending && !answersQuery.isError && answers.length === 0 ? (
            <p className="text-sm text-muted-foreground">This response has no saved answers.</p>
          ) : null}
          <dl className="divide-y">
            {answers.map((answer) => (
              <div key={answer.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(10rem,1fr)_2fr]">
                <dt className="break-all text-sm font-medium">{getFieldLabel(answer.fieldId)}</dt>
                <dd className="whitespace-pre-wrap wrap-break-word text-sm text-muted-foreground">
                  {formatAnswer(answer.value)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
