import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const subscribers = pgTable(
  "subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    status: text("status").notNull().default("active"),
    source: text("source").notNull().default("website"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex("subscribers_email_idx").on(table.email),
    index("subscribers_status_idx").on(table.status),
    index("subscribers_created_at_idx").on(table.createdAt),
  ],
);

export type SubscriberSelect = typeof subscribers.$inferSelect;
export type SubscriberInsert = typeof subscribers.$inferInsert;
