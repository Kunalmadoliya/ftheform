import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env";
import * as schema from "./auth-schema";

export const db = drizzle(env.DATABASE_URL, { schema });
export * from "drizzle-orm";
export default db;
