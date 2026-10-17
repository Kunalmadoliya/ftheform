import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import {authRouter} from "./routes/auth/route" 
import { formRouter } from "./routes/form/route";
import { formFieldRouter } from "./routes/form-field/route";
import { formSnapshotRouter } from "./routes/form_snapshot/index";
import { submissionRouter } from "./routes/submission/route";
import { answerRouter } from "./routes/answer/route";
import { formAiRouter } from "./routes/form-ai/route";
import { paymentRouter } from "./routes/payment/route";
import { contactRouter } from "./routes/contact/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  form: formRouter,
  formField: formFieldRouter,
  formSnapshot: formSnapshotRouter,
  submission: submissionRouter,
  answer: answerRouter,
  formAi: formAiRouter,
  payment: paymentRouter,
  contact: contactRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
