import { trpc } from "~/trpc/client";

export function useFormResponses(formId: string, submissionId?: string, fieldId?: string) {
  const utils = trpc.useUtils();
  const submissionsQuery = trpc.submission.listSubmissionsByForm.useQuery(
    { formId },
    { enabled: Boolean(formId) },
  );
  const answersQuery = trpc.answer.getAnswersBySubmission.useQuery(
    { submissionId: submissionId ?? "" },
    { enabled: Boolean(submissionId) },
  );
  const fieldAnswersQuery = trpc.answer.getAnswersByField.useQuery(
    { fieldId: fieldId ?? "" },
    { enabled: Boolean(fieldId) },
  );
  const deleteSubmissionMutation = trpc.submission.deleteSubmission.useMutation({
    onSuccess: () => utils.submission.listSubmissionsByForm.invalidate({ formId }),
  });

  return {
    submissions: submissionsQuery.data ?? [],
    submissionsQuery,
    answers: answersQuery.data ?? [],
    answersQuery,
    fieldAnswers: fieldAnswersQuery.data ?? [],
    fieldAnswersQuery,
    deleteSubmissionAsync: deleteSubmissionMutation.mutateAsync,
    isDeletingSubmission: deleteSubmissionMutation.isPending,
  };
}
