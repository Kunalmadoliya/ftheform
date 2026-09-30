import { trpc } from "~/trpc/client";

export function usePublicForm(formId: string) {
  const utils = trpc.useUtils();
  const formQuery = trpc.form.getPublicFormById.useQuery(
    { formId },
    { enabled: Boolean(formId), retry: false },
  );
  const snapshotQuery = trpc.formSnapshot.getLatestSnapshot.useQuery(
    { formId },
    { enabled: Boolean(formId) && Boolean(formQuery.data?.isPublished), retry: false },
  );
  const incrementViewMutation = trpc.form.incrementFormViewCount.useMutation();

  return {
    form: formQuery.data,
    snapshot: snapshotQuery.data,
    formQuery,
    snapshotQuery,
    incrementView: incrementViewMutation.mutate,
    incrementViewAsync: incrementViewMutation.mutateAsync,
    incrementViewMutation,
    utils,
  };
}
