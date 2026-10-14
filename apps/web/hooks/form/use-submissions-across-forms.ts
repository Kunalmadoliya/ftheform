import { trpc } from "~/trpc/client";

export type FormReference = { id: string; title: string };

export function useSubmissionsAcrossForms(forms: FormReference[]) {
  const queries = trpc.useQueries((t) =>
    forms.map((item) => t.submission.listSubmissionsByForm({ formId: item.id })),
  );

  return {
    entries: forms.map((form, index) => ({
      form,
      submissions: queries[index]?.data ?? [],
      query: queries[index],
    })),
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
  };
}

export function useAnswersForSubmissions(submissionIds: string[]) {
  const queries = trpc.useQueries((t) =>
    submissionIds.map((submissionId) => t.answer.getAnswersBySubmission({ submissionId })),
  );

  return {
    answersBySubmission: new Map(
      submissionIds.map((submissionId, index) => [
        submissionId,
        queries[index]?.data ?? [],
      ]),
    ),
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
  };
}
