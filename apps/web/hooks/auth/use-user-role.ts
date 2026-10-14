import { trpc } from "~/trpc/client";

export function useUserRole() {
  return trpc.auth.getCurrentUserRole.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });
}
