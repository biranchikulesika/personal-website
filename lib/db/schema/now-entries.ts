import {
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { contentStatusEnum } from "./posts";

export const nowEntries = pgTable(
  "now_entries",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().default(""),
    title: text("title").notNull(),
    date: text("date").notNull(),
    content: text("content").notNull().default(""),
    location: text("location").notNull().default(""),
    status: contentStatusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    lastEditedAt: timestamp("last_edited_at", { withTimezone: true }),
  },
  (table) => [
    index("now_entries_status_idx").on(table.status),
    index("now_entries_created_at_idx").on(table.createdAt),
    index("now_entries_slug_idx").on(table.slug),
  ],
);

export type NowEntrySelect = typeof nowEntries.$inferSelect;
export type NowEntryInsert = typeof nowEntries.$inferInsert;
