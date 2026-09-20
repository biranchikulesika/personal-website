import {
  pgTable,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const books = pgTable(
  "books",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    description: text("description").notNull().default(""),
    date: text("date"),
    persona: text("persona"),
    tags: text("tags")
      .array()
      .default(sql`'{}'::text[]`),
    cover: text("cover"),
    link: text("link"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex("books_slug_idx").on(table.slug),
    index("idx_books_is_published").on(table.isPublished),
    index("books_created_at_idx").on(table.createdAt),
  ],
);

export type BookSelect = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;
