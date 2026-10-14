import { trpc } from "~/trpc/client";

export function useSubmission(formId: string, submissionId?: string) {
  const activeSubmissionQuery = trpc.submission.getActiveSubmission.useQuery(
    { formId, submissionId },
    { enabled: Boolean(formId && submissionId), retry: false },
  );
  const submissionQuery = trpc.submission.getSubmissionById.useQuery(
    { submissionId: submissionId ?? "" },
    { enabled: Boolean(submissionId), retry: false },
  );
  const startMutation = trpc.submission.startSubmission.useMutation();
  const draftMutation = trpc.submission.updateDraftAnswer.useMutation();
  const activityMutation = trpc.submission.updateLastActivity.useMutation();
  const submitMutation = trpc.submission.submitForm.useMutation();
  const saveBulkAnswersMutation = trpc.answer.saveBulkAnswers.useMutation();
  const saveAnswerMutation = trpc.answer.saveAnswer.useMutation();
  const markNotSubmittedMutation = trpc.submission.markNotSubmitted.useMutation();
  const deleteSubmissionMutation = trpc.submission.deleteSubmission.useMutation();
  const versionQuery = trpc.submission.checkVersionMismatch.useQuery(
    { formId, submissionId: submissionId ?? "" },
    { enabled: Boolean(formId && submissionId), retry: false },
  );

  return {
    startSubmission: startMutation.mutate,
    startSubmissionAsync: startMutation.mutateAsync,
    updateDraftAnswer: draftMutation.mutate,
    updateDraftAnswerAsync: draftMutation.mutateAsync,
    saveBulkAnswers: saveBulkAnswersMutation.mutate,
    saveBulkAnswersAsync: saveBulkAnswersMutation.mutateAsync,
    updateLastActivity: activityMutation.mutate,
    updateLastActivityAsync: activityMutation.mutateAsync,
    submitForm: submitMutation.mutate,
    submitFormAsync: submitMutation.mutateAsync,
    markNotSubmitted: markNotSubmittedMutation.mutate,
    markNotSubmittedAsync: markNotSubmittedMutation.mutateAsync,
    deleteSubmission: deleteSubmissionMutation.mutate,
    deleteSubmissionAsync: deleteSubmissionMutation.mutateAsync,
    saveAnswer: saveAnswerMutation.mutate,
    saveAnswerAsync: saveAnswerMutation.mutateAsync,
    activeSubmissionQuery,
    submissionQuery,
    versionQuery,
    isStarting: startMutation.isPending,
    isSavingDraft: draftMutation.isPending,
    isSavingAnswers: saveBulkAnswersMutation.isPending,
    isSubmitting: submitMutation.isPending,
    startError: startMutation.error,
    draftError: draftMutation.error,
    answersError: saveBulkAnswersMutation.error,
    submitError: submitMutation.error,
  };
}
