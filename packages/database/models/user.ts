import { pgTable, varchar, uuid, pgEnum, boolean, timestamp, text } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["user", "admin"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  fullName: varchar("full_name", { length: 45 }).notNull(),

  email: varchar("email", { length: 322 }).notNull().unique(),

  salt: text("salt"),
  password: text("password"),

  role: rolesEnum("role").default("user").notNull(),

  isVerified: boolean("is_verified").default(false).notNull(),

  resetPasswordToken: varchar("reset_password_token", { length: 255 }),

  resetPasswordExpires: timestamp("reset_password_expires"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
