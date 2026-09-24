import { auth } from "@repo/database/lib/auth";
import { form } from "@repo/database/models/form-schema";
import {
  SignInInputType,
  SignUpInputType,
  updateFormResponseLimit,
  type UpdateFormResponseLimitType,
} from "./model";
import { db, eq } from "@repo/database";

export default class authService {
  public async signIn(input: SignInInputType) {
    const { email, password } = input;

    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    return result; // { user, session } better-auth khud return karega
  }

  public async signUp(input: SignUpInputType) {
    const { email, password, name } = input;
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
    });
    return response;
  }

  public async updateFormResponseLimit(input: UpdateFormResponseLimitType) {
    const { formId, userRole, responseLimit } = updateFormResponseLimit.parse(input);

    if (userRole !== "admin") {
      throw new Error("Unauthorized: Only admin can update form response limit");
    }

    const [updatedLimit] = await db
      .update(form)
      .set({ responseLimit })
      .where(eq(form.id, formId))
      .returning({ responseLimit: form.responseLimit });

    return updatedLimit;
  }
}
