import { trpc } from "~/trpc/client";

export function useForm() {
  const utils = trpc.useUtils();
  const formsQuery = trpc.form.listFormsByUser.useQuery();
  const {
    mutateAsync: createFormAsync,
    mutate: createForm,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    isPending,
    status,
  } = trpc.form.createInitialForm.useMutation({
    onSuccess: () => utils.form.listFormsByUser.invalidate(),
  });

  const renameFormMutation = trpc.form.renameForm.useMutation({
    onSuccess: () => utils.form.listFormsByUser.invalidate(),
  });
  const updateFormDescriptionMutation = trpc.form.updateFormDescription.useMutation({
    onSuccess: () => utils.form.listFormsByUser.invalidate(),
  });
  const deleteFormMutation = trpc.form.deleteForm.useMutation({
    onSuccess: () => utils.form.listFormsByUser.invalidate(),
  });

  return {
    forms: formsQuery.data ?? [],
    formsQuery,
    createFormAsync,
    createForm,
    renameForm: renameFormMutation.mutate,
    renameFormAsync: renameFormMutation.mutateAsync,
    updateFormDescription: updateFormDescriptionMutation.mutate,
    updateFormDescriptionAsync: updateFormDescriptionMutation.mutateAsync,
    deleteForm: deleteFormMutation.mutate,
    deleteFormAsync: deleteFormMutation.mutateAsync,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    isPending,
    status,
  };
}

export function useFormById(formId: string) {
  return trpc.form.getFormById.useQuery(
    { formId },
    { enabled: Boolean(formId) },
  );
}