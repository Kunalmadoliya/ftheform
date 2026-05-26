import { trpc } from "~/trpc/client";

export const useCreateForm = () => {
    const utils = trpc.useUtils();
    const {
        mutateAsync: createFormAsync,
        mutate: createForm,
        isError,
        error,
        failureCount,
        isIdle,
        isSuccess,
        status,
        reset,
    } = trpc.form.createForm.useMutation({
        onSuccess: async () => {
            await utils.form.invalidate();
        },
    });

    return {
        createFormAsync,
        createForm,
        isError,
        error,
        failureCount,
        isIdle,
        isSuccess,
        status,
        reset,
    };
};

// export const useGetFormById = () => {
//     const { 
//         data: form,
//         error,
//         isLoading,
//         isFetched,
//         isFetching,
//         status,
//     } = trpc.form.getFormById.useQuery();

//     return {
//         form,
//         error,
//         isLoading,
//         isFetched,
//         isFetching,
//         status,
//     };
// }