import {
  pgTable,
  text,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { contentStatusEnum } from "./posts";

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description").notNull().default(""),
    content: jsonb("content")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`),
    date: date("date"),
    persona: text("persona"),
    tags: text("tags")
      .array()
      .default(sql`'{}'::text[]`),
    coverImage: text("cover_image"),
    status: contentStatusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex("notes_slug_idx").on(table.slug),
    index("notes_status_idx").on(table.status),
    index("notes_created_at_idx").on(table.createdAt),
  ],
);

export type NoteSelect = typeof notes.$inferSelect;
export type NoteInsert = typeof notes.$inferInsert;
