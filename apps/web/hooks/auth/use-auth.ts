import { trpc } from "~/trpc/client";

export function useSignin() {
  const {
    mutateAsync: signInAsync,
    mutate: signIn,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    isPending,
    status,
  } = trpc.auth.signIn.useMutation();

  return {
    signInAsync,
    signIn,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    isPending,
    status,
  };
}

export function useSignup() {
  const {
    mutateAsync: signUpAsync,
    mutate: signUp,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    isPending,
    status,
  } = trpc.auth.signUp.useMutation();

  return {
    signUpAsync,
    signUp,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    isPending,
    status,
  };
}
