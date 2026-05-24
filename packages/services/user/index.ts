import { randomBytes, createHmac } from "node:crypto";

import { env } from "../env";
// import { googleOAuth2Client } from "../clients/google-oauth";
// import { GetAuthenticationMethodOutputSchema } from "./model";
import {
  createUserWithEmailAndPasswordInputType,
  createUserWithEmailAndPasswordInput,
  generateUserTokenPayloadType,
  generateUserTokenPayload,
  signInUserWithEmailAndPasswordInputType,
  signInUserWithEmailAndPasswordInput,
} from "./model";
import * as JWT from "jsonwebtoken";
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

  private async generateUserToken(payload: generateUserTokenPayloadType) {
    const { id } = await generateUserTokenPayload.parseAsync(payload);

    const token = JWT.sign({ id }, env.JWT_SECRET);

    return { token };
  }

  private async verifyUserToken(token: string): Promise<generateUserTokenPayloadType> {
    try {
      const varifiedUser = JWT.verify(token, env.JWT_SECRET) as generateUserTokenPayloadType;
      return varifiedUser;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  public async getUserInfoByID(id: string) {
    const user = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!user || user.length === 0) {
      throw ApiError.badRequest("User not found");
    }
    return user[0];
  }

  public async createUserWithEmailAndPassword(payload: createUserWithEmailAndPasswordInputType) {
    const { fullName, email, password } =
      await createUserWithEmailAndPasswordInput.parseAsync(payload);

    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw ApiError.conflict("User already exists");
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

    if (!insertedUser || insertedUser.length === 0 || !insertedUser[0]?.id) {
      throw ApiError.badRequest("User not created");
    }

    const { token } = await this.generateUserToken({ id: insertedUser[0].id });

    return {
      id: insertedUser[0]?.id,
      token,
    };
  }

  public async signInUserWithEmailAndPassword(payload: signInUserWithEmailAndPasswordInputType) {
    const { email, password } = await signInUserWithEmailAndPasswordInput.parseAsync(payload);

    const existingUser = await this.getUserByEmail(email);
    if (!existingUser) {
      throw ApiError.badRequest("Invalid email or password");
    }

    if (!existingUser.password || !existingUser.salt) {
      throw ApiError.badRequest("Something went wrong, Please try after some time");
    }

    const hash = createHmac("sha256", existingUser.salt).update(password).digest("hex");

    if (hash !== existingUser.password) {
      throw ApiError.badRequest("Invalid email or password");
    }

    const { token } = await this.generateUserToken({ id: existingUser.id });

    return {
      id: existingUser.id,
      token,
    };
  }

  public async verifyDecodedUser(token: string) {
    const { id } = await this.verifyUserToken(token);
    return { id};
  }

  public async logoutUser() {
    try {
      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      throw ApiError.badRequest("Something went wrong, Please try after some time");
    }
  }
}

export default UserService;
