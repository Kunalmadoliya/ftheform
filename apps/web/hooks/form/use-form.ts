import { trpc } from "~/trpc/client";

export type FormLifecycleFilter = "live" | "draft" | "archived";

export function useFormLifecycle(lifecycle: FormLifecycleFilter) {
  const utils = trpc.useUtils();
  const formsQuery = trpc.form.listFormsByLifecycle.useQuery({ lifecycle });
  const invalidateFormData = async (formId: string) => {
    await Promise.all([
      utils.form.listFormsByLifecycle.invalidate({ lifecycle: "live" }),
      utils.form.listFormsByLifecycle.invalidate({ lifecycle: "draft" }),
      utils.form.listFormsByLifecycle.invalidate({ lifecycle: "archived" }),
      utils.form.listFormsByUser.invalidate(),
      utils.form.getFormById.invalidate({ formId }),
      utils.form.getPublicFormById.invalidate({ formId }),
      utils.formSnapshot.getLatestSnapshot.invalidate({ formId }),
    ]);
  };
  const archiveMutation = trpc.form.archiveForm.useMutation({
    onSuccess: (result) => invalidateFormData(result.id),
  });
  const restoreMutation = trpc.form.restoreForm.useMutation({
    onSuccess: (result) => invalidateFormData(result.id),
  });
  const deleteMutation = trpc.form.deleteForm.useMutation({
    onSuccess: (result) => invalidateFormData(result.id),
  });

  return {
    formsQuery,
    archiveFormAsync: archiveMutation.mutateAsync,
    restoreFormAsync: restoreMutation.mutateAsync,
    deleteFormAsync: deleteMutation.mutateAsync,
    getDeletionPreview: (formId: string) => utils.form.getDeletionPreview.fetch({ formId }),
    exportCsv: (formId: string) => utils.form.exportCsv.fetch({ formId }),
    isLifecycleMutationPending:
      archiveMutation.isPending || restoreMutation.isPending || deleteMutation.isPending,
  };
}

export function useForm() {
  const utils = trpc.useUtils();
  const formsQuery = trpc.form.listFormsByUser.useQuery();
  const invalidateLifecycleLists = async () => Promise.all([
    utils.form.listFormsByLifecycle.invalidate({ lifecycle: "live" }),
    utils.form.listFormsByLifecycle.invalidate({ lifecycle: "draft" }),
    utils.form.listFormsByLifecycle.invalidate({ lifecycle: "archived" }),
  ]);
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
    onSuccess: async () => {
      await Promise.all([utils.form.listFormsByUser.invalidate(), invalidateLifecycleLists()]);
    },
  });

  const renameFormMutation = trpc.form.renameForm.useMutation({
    onSuccess: () => {
      void utils.form.listFormsByUser.invalidate();
      void invalidateLifecycleLists();
      void utils.form.getFormById.invalidate();
    },
  });
  const updateFormDescriptionMutation = trpc.form.updateFormDescription.useMutation({
    onSuccess: () => {
      void utils.form.listFormsByUser.invalidate();
      void invalidateLifecycleLists();
      void utils.form.getFormById.invalidate();
    },
  });
  const updateFormSettingsMutation = trpc.form.updateSettings.useMutation({
    onSuccess: () => {
      void utils.form.listFormsByUser.invalidate();
      void invalidateLifecycleLists();
      void utils.form.getFormById.invalidate();
    },
  });
  const deleteFormMutation = trpc.form.deleteForm.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.form.listFormsByUser.invalidate(), invalidateLifecycleLists()]);
    },
  });
  const toggleFormOpenMutation = trpc.form.toggleFormOpen.useMutation({
    onSuccess: () => {
      void utils.form.listFormsByUser.invalidate();
      void invalidateLifecycleLists();
      void utils.form.getFormById.invalidate();
    },
  });
  const incrementFormViewCountMutation = trpc.form.incrementFormViewCount.useMutation();
  const publishFormMutation = trpc.form.publishForm.useMutation({
    onSuccess: () => {
      void utils.form.listFormsByUser.invalidate();
      void invalidateLifecycleLists();
      void utils.form.getFormById.invalidate();
    },
  });
  const unpublishFormMutation = trpc.form.unpublishForm.useMutation({
    onSuccess: () => {
      void utils.form.listFormsByUser.invalidate();
      void invalidateLifecycleLists();
      void utils.form.getFormById.invalidate();
    },
  });
  const updateFormResponseLimitMutation = trpc.form.updateResponseLimit.useMutation({
    onSuccess: () => {
      void utils.form.listFormsByUser.invalidate();
      void invalidateLifecycleLists();
      void utils.form.getFormById.invalidate();
    },
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
    updateSettingsAsync: updateFormSettingsMutation.mutateAsync,
    deleteForm: deleteFormMutation.mutate,
    deleteFormAsync: deleteFormMutation.mutateAsync,
    toggleFormOpen: toggleFormOpenMutation.mutate,
    toggleFormOpenAsync: toggleFormOpenMutation.mutateAsync,
    updateResponseLimit: updateFormResponseLimitMutation.mutate,
    updateResponseLimitAsync: updateFormResponseLimitMutation.mutateAsync,
    incrementFormViewCount: incrementFormViewCountMutation.mutate,
    incrementFormViewCountAsync: incrementFormViewCountMutation.mutateAsync,
    publishForm: publishFormMutation.mutate,
    publishFormAsync: publishFormMutation.mutateAsync,
    unpublishForm: unpublishFormMutation.mutate,
    unpublishFormAsync: unpublishFormMutation.mutateAsync,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    isPending,
    status,
  };
}

export function useFormById(formId: string, enabled = true) {
  return trpc.form.getFormById.useQuery(
    { formId },
    { enabled: Boolean(formId) && enabled, retry: false },
  );
}
