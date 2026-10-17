import { protectedProcedure } from "../../trpc";
import {
  createRazorpayOrderOutput,
  userCreditsOutput,
  verifyPaymentInput,
  verifyPaymentOutput,
} from "@repo/services/payment/model";
import PaymentService from "@repo/services/payment";

const paymentService = new PaymentService();

export const paymentRouter = {
  getUserCredits: protectedProcedure
    .output(userCreditsOutput)
    .query(({ ctx }) => paymentService.getUserCredits(ctx.userId)),

  createOrder: protectedProcedure
    .output(createRazorpayOrderOutput)
    .mutation(({ ctx }) => paymentService.createOrder(ctx.userId)),

  verifyPayment: protectedProcedure
    .input(verifyPaymentInput)
    .output(verifyPaymentOutput)
    .mutation(({ ctx, input }) => paymentService.verifyPayment(input, ctx.userId)),
};
