import { trpc } from "~/trpc/client";

export function useSubmission(formId: string, submissionId?: string) {
  const startMutation = trpc.submission.startSubmission.useMutation();
  const draftMutation = trpc.submission.updateDraftAnswer.useMutation();
  const activityMutation = trpc.submission.updateLastActivity.useMutation();
  const submitMutation = trpc.submission.submitForm.useMutation();
  const versionQuery = trpc.submission.checkVersionMismatch.useQuery(
    { formId, submissionId: submissionId ?? "" },
    { enabled: Boolean(formId && submissionId), retry: false },
  );

  return {
    startSubmission: startMutation.mutate,
    startSubmissionAsync: startMutation.mutateAsync,
    updateDraftAnswer: draftMutation.mutate,
    updateDraftAnswerAsync: draftMutation.mutateAsync,
    updateLastActivity: activityMutation.mutate,
    updateLastActivityAsync: activityMutation.mutateAsync,
    submitForm: submitMutation.mutate,
    submitFormAsync: submitMutation.mutateAsync,
    versionQuery,
    isStarting: startMutation.isPending,
    isSavingDraft: draftMutation.isPending,
    isSubmitting: submitMutation.isPending,
    startError: startMutation.error,
    draftError: draftMutation.error,
    submitError: submitMutation.error,
  };
}
