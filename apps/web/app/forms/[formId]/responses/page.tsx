"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ThemeToggle } from "~/components/theme-toggle";
import { IconBack, IconDelete, IconSpinner } from "~/components/icons/app-icons";
import { useFormResponses } from "~/hooks/form/use-form-responses";
import { useFormSnapshotById } from "~/hooks/form/use-form-snapshots";
import { authClient } from "~/lib/auth-client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  async function confirmDeleteResponse() {
    if (!selectedSubmissionId) return;
    try {
      await deleteSubmissionAsync({ submissionId: selectedSubmissionId });
      setSelectedSubmissionId(undefined);
      setIsDeleteDialogOpen(false);
      toast.success("Response deleted.");
    } catch (error) {
      toast.error(getTrpcErrorMessage(error, "Unable to delete this response."));
    }
  }

  if (isSessionPending || !session?.user) return null;

  function getFieldLabel(fieldId: string | null, fieldKey: string) {
    const fields = snapshotQuery.data?.fieldsJson;
    if (!Array.isArray(fields)) return `Field ${fieldId ?? fieldKey}`;
    const field = fields.find(
      (candidate) =>
        candidate &&
        typeof candidate === "object" &&
        "fieldKey" in candidate &&
        candidate.fieldKey === fieldKey &&
        "label" in candidate &&
        typeof candidate.label === "string",
    );
    return field && typeof field === "object" && "label" in field && typeof field.label === "string"
      ? field.label
      : `Field ${fieldId ?? fieldKey}`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon-sm" className="h-8 w-8">
              <Link href="/dashboard" aria-label="Back to dashboard">
                <IconBack className="size-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Form Responses
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 p-6 lg:grid-cols-[20rem_1fr] lg:p-10">
        {/* Left Column: Submissions List */}
        <Card className="h-fit rounded-2xl border-border bg-card shadow-none">
          <CardHeader className="p-5">
            <h1 className="text-base font-semibold text-foreground">Submissions</h1>
            <p className="font-mono text-xs text-muted-foreground">{submissions.length} completed</p>
          </CardHeader>
          <CardContent className="space-y-2 p-5 pt-0">
            {submissionsQuery.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : null}

            {submissionsQuery.isError ? (
              <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 font-mono text-xs text-destructive" role="alert">
                Unable to load responses.
              </p>
            ) : null}

            {!submissionsQuery.isPending && !submissionsQuery.isError && submissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="font-mono text-xs text-muted-foreground">No submissions recorded yet.</p>
              </div>
            ) : null}

            {submissions.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedSubmissionId(item.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedSubmissionId === item.id
                    ? "border-foreground bg-muted font-medium text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span className="block font-mono text-xs text-foreground">ID: {item.id.slice(0, 8)}</span>
                <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                  {new Date(item.submittedAt ?? item.startedAt).toLocaleString()}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Right Column: Submission Details */}
        <Card className="min-h-80 rounded-2xl border-border bg-card shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Response Details</h2>
              {selectedSubmission ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Submitted {new Date(selectedSubmission.submittedAt ?? selectedSubmission.startedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
            {selectedSubmission ? (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 font-mono text-xs"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeletingSubmission}
              >
                <IconDelete className="size-3.5" />
                Delete response
              </Button>
            ) : null}
          </CardHeader>

          <CardContent className="p-6 pt-0">
            {!selectedSubmission ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center font-mono text-xs text-muted-foreground">
                Select a response from the left panel to view its answers.
              </div>
            ) : null}

            {answersQuery.isPending && selectedSubmission ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : null}

            {answersQuery.isError ? (
              <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 font-mono text-xs text-destructive" role="alert">
                Unable to load this response.
              </p>
            ) : null}

            {selectedSubmission && !answersQuery.isPending && !answersQuery.isError && answers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center font-mono text-xs text-muted-foreground">
                This response has no saved answers.
              </div>
            ) : null}

            <dl className="grid gap-3 sm:grid-cols-2">
              {answers.map((answer) => (
                <div key={answer.id} className="rounded-xl border border-border bg-muted/10 p-4 space-y-1">
                  <dt className="font-mono text-xs text-muted-foreground">
                    {getFieldLabel(answer.fieldId, answer.fieldKey)}
                  </dt>
                  <dd className="whitespace-pre-wrap break-words font-sans text-sm text-foreground">
                    {formatAnswer(answer.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </main>

      {/* Accessible Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Delete response
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground">
              This action cannot be undone. Are you sure you want to permanently delete this submission?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingSubmission}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 font-mono text-xs"
              onClick={() => void confirmDeleteResponse()}
              disabled={isDeletingSubmission}
            >
              {isDeletingSubmission ? (
                <IconSpinner className="size-3.5 animate-spin" />
              ) : (
                <IconDelete className="size-3.5" />
              )}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
