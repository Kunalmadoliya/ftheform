import { protectedProcedure } from "../../trpc";
import { userCreditsOutput } from "@repo/services/payment/model";
import PaymentService from "@repo/services/payment";

const paymentService = new PaymentService();

export const paymentRouter = {
  getUserCredits: protectedProcedure
    .output(userCreditsOutput)
    .query(({ ctx }) => paymentService.getUserCredits(ctx.userId)),
};
