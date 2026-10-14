import { trpc } from "~/trpc/client";
import { useLatestFormSnapshot } from "~/hooks/form/use-form-snapshots";

export function usePublicForm(formId: string) {
  const utils = trpc.useUtils();
  const formQuery = trpc.form.getPublicFormById.useQuery(
    { formId },
    { enabled: Boolean(formId), retry: false },
  );
  const snapshotQuery = useLatestFormSnapshot(
    formId,
    Boolean(formQuery.data?.isPublished || formQuery.data?.isOwner),
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
