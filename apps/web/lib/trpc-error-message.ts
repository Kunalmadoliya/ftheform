type ApiErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "TOO_MANY_REQUESTS"
  | "UNAUTHORIZED";

type ErrorWithCode = {
  data?: {
    code?: unknown;
  };
};

function hasErrorCode(error: unknown): error is ErrorWithCode {
  return typeof error === "object" && error !== null && "data" in error;
}

const messages: Record<ApiErrorCode, string> = {
  BAD_REQUEST: "Please check the information you entered.",
  CONFLICT: "This item has changed or is already finalized. Refresh and try again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested item could not be found.",
  TOO_MANY_REQUESTS: "The response limit has been reached. Try again later.",
  UNAUTHORIZED: "Please sign in to continue.",
};

export function getTrpcErrorMessage(error: unknown, fallback: string) {
  if (!hasErrorCode(error)) return fallback;
  const code = error.data?.code;
  return typeof code === "string" && code in messages
    ? messages[code as ApiErrorCode]
    : fallback;
}
