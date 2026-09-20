import {
  pgTable,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const contributions = pgTable(
  "contributions",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id"),
    paymentId: text("payment_id"),
    amount: numeric("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: text("status").notNull().default("pending"),
    name: text("name").notNull().default("Anonymous Patron"),
    email: text("email"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    source: text("source").notNull().default("razorpay"),
  },
  (table) => [
    index("idx_contributions_payment_id").on(table.paymentId),
    index("idx_contributions_order_id").on(table.orderId),
    index("idx_contributions_created_at").on(table.createdAt),
  ],
);

export type ContributionSelect = typeof contributions.$inferSelect;
export type ContributionInsert = typeof contributions.$inferInsert;
