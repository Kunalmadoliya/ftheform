import { trpc } from "~/trpc/client";

export const useCreateForm = () => {
    const utils = trpc.useUtils();
    const { mutateAsync: createFormAsync, isError, error } =
        trpc.form.createForm.useMutation({
            onSuccess: async () => {
                await utils.form.invalidate();
            },
        });

    return {
        createFormAsync,
        isError,
        error,
    };
};