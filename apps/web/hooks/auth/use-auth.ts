import { trpc } from "~/trpc/client";
import { authClient } from "~/lib/auth-client";
import { getAuthCallbackUrl } from "~/lib/auth-redirect";

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

export function useGoogleSignIn() {
  const googleSignIn = () =>
    authClient.signIn.social({
      provider: "google",
      callbackURL: getAuthCallbackUrl(
        new URLSearchParams(window.location.search).get("next"),
        window.location.origin,
      ),
    });

  return { googleSignIn };
}

export function useGithubSignIn() {
  const githubSignIn = () =>
    authClient.signIn.social({
      provider: "github",
      callbackURL: getAuthCallbackUrl(
        new URLSearchParams(window.location.search).get("next"),
        window.location.origin,
      ),
    });

  return { githubSignIn };
}
