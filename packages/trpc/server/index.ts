import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import {authRouter} from "./routes/auth/route" 
import { formRouter } from "./routes/form/route";
import { formFieldRouter } from "./routes/form-field/route";

export const serverRouter = router({
  health: healthRouter,
  auth : authRouter ,
  form : formRouter,
  formField: formFieldRouter,

});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
