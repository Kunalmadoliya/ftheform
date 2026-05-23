import { randomBytes, createHmac } from "node:crypto";

import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import { GetAuthenticationMethodOutputSchema } from "./model";
import {
  createUserWithEmailAndPasswordInputType,
  createUserWithEmailAndPasswordInput,
} from "./model";
import { usersTable } from "@repo/database/models/user";
import { db, eq } from "@repo/database";
import { ApiError } from "@repo/api-responses/api-error";

class UserService {
  // public async getAuthenticationMethods(): Promise<
  //   ReadonlyArray<GetAuthenticationMethodOutputSchema>
  // > {
  //   const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [];

  //   const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

  //   if (isGoogleConfigured) {
  //     const url = googleOAuth2Client.generateAuthUrl();
  //     supportedAuthenticationProviders.push({
  //       provider: "GOOGLE_OAUTH",
  //       displayName: "Google",
  //       displayText: "Signin with Google",
  //       authUrl: url,
  //     });
  //   }

  //   return supportedAuthenticationProviders;
  // }

  private async getUserByEmail(email: string) {
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || user.length === 0) {
      return null;
    }
    return user[0];
  }

  public async createUserWithEmailAndPassword(payload: createUserWithEmailAndPasswordInputType) {
    const { fullName, email, password } =
      await createUserWithEmailAndPasswordInput.parseAsync(payload);

    const existingUser = await this.getUserByEmail(email);
    if(existingUser){
      throw ApiError.conflict("User already exists")
    }

    const salt = randomBytes(16).toString("hex");
    const hash = createHmac("sha256", salt).update(password).digest("hex");

    const insertedUser = await db
      .insert(usersTable)
      .values({
        fullName,
        email,
        password: hash,
        salt,
      })
      .returning({ id: usersTable.id });

    if (!insertedUser || insertedUser.length === 0 || !insertedUser[0]?.id ) {
      throw ApiError.badRequest("User not created");
    }

    return {
      id: insertedUser[0]?.id,
    };
  }
}

export default UserService;
