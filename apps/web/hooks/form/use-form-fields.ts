import { trpc } from "~/trpc/client";

export function useFormFields(formId: string) {
  const utils = trpc.useUtils();
  const fieldsQuery = trpc.formField.listFormFields.useQuery(
    { formId },
    { enabled: Boolean(formId) },
  );

  const createFieldMutation = trpc.formField.createFormField.useMutation({
    onSuccess: () => utils.formField.listFormFields.invalidate({ formId }),
  });
  const updateFieldMutation = trpc.formField.updateFormField.useMutation({
    onSuccess: () => utils.formField.listFormFields.invalidate({ formId }),
  });
  const deleteFieldMutation = trpc.formField.deleteFormField.useMutation({
    onSuccess: () => utils.formField.listFormFields.invalidate({ formId }),
  });
  const reorderFieldMutation = trpc.formField.reorderFormFields.useMutation({
    onSuccess: () => utils.formField.listFormFields.invalidate({ formId }),
  });

  return {
    fields: fieldsQuery.data ?? [],
    fieldsQuery,
    createField: createFieldMutation.mutate,
    createFieldAsync: createFieldMutation.mutateAsync,
    updateField: updateFieldMutation.mutate,
    updateFieldAsync: updateFieldMutation.mutateAsync,
    deleteField: deleteFieldMutation.mutate,
    deleteFieldAsync: deleteFieldMutation.mutateAsync,
    reorderFields: reorderFieldMutation.mutate,
    reorderFieldsAsync: reorderFieldMutation.mutateAsync,
    isCreating: createFieldMutation.isPending,
    isUpdating: updateFieldMutation.isPending,
    isDeleting: deleteFieldMutation.isPending,
    isReordering: reorderFieldMutation.isPending,
  };
}