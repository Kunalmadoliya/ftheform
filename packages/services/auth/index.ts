import { auth } from "@repo/database/lib/auth";
import { signInInput, SignInInputType, signUpInput, SignUpInputType } from "./model";

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
}
