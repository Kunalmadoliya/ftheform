import { publicProcedure } from "../../trpc";
import { sendMessageInput, sendMessageOutput } from "@repo/services/contact/model";
import ContactService from "@repo/services/contact";

const contactService = new ContactService();

export const contactRouter = {
  sendMessage: publicProcedure
    .input(sendMessageInput)
    .output(sendMessageOutput)
    .mutation(({ ctx, input }) => contactService.sendMessage(input, ctx.clientIp)),
};
