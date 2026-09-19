import {trpc} from "~/trpc/client"


export const useHealth = () => {
   const {status , isError} = trpc.health.getHealth.useQuery()

   return {status , isError}
}