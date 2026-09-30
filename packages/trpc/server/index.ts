import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import {authRouter} from "./routes/auth/route" 
import { formRouter } from "./routes/form/route";
import { formFieldRouter } from "./routes/form-field/route";
import { formSnapshotRouter } from "./routes/form_snapshot/index";
import { submissionRouter } from "./routes/submission/route";

export const serverRouter = router({
  health: healthRouter,
  auth : authRouter ,
  form : formRouter,
  formField: formFieldRouter,
  formSnapshot: formSnapshotRouter,
  submission: submissionRouter,

});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
