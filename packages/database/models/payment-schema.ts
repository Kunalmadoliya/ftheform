import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "../auth-schema";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "captured",
  "failed",
]);

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    signature: text("signature"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    creditsAdded: integer("credits_added").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_userId_idx").on(table.userId),
  ],
);

export const paymentRelations = relations(payment, ({ one }) => ({
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),
}));
