export type FormAccessPolicy =
  | "anonymous_and_authenticated"
  | "anonymous_only"
  | "authenticated_only";

import { serviceError } from "../errors";

export function assertFormAccess(policy: FormAccessPolicy, userId: string | null | undefined) {
  if (policy === "authenticated_only" && !userId) {
    throw serviceError("UNAUTHORIZED", "Authentication is required to access this form.");
  }
  if (policy === "anonymous_only" && userId) {
    throw serviceError("FORBIDDEN", "This form only accepts anonymous responses.");
  }
}
