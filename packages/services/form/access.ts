export type FormAccessPolicy =
  | "anonymous_and_authenticated"
  | "anonymous_only"
  | "authenticated_only";

export function assertFormAccess(policy: FormAccessPolicy, userId: string | null | undefined) {
  if (policy === "authenticated_only" && !userId) {
    throw new Error("Authentication required to access this form.");
  }
  if (policy === "anonymous_only" && userId) {
    throw new Error("This form only accepts anonymous responses.");
  }
}
