import {
  pgTable,
  text,
  uuid,
  timestamp,
  date,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { BookCard, PostSection } from "@/lib/types";

export const contentStatusEnum = pgEnum("content_status", [
  "published",
  "unpublished",
]);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description").notNull().default(""),
    persona: text("persona"),
    tags: text("tags")
      .array()
      .default(sql`'{}'::text[]`),
    publishedAt: date("published_at"),
    lastEditedAt: date("last_edited_at"),
    assumedAudience: text("assumed_audience").default(""),
    intro: jsonb("intro")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`),
    sections: jsonb("sections")
      .$type<PostSection[]>()
      .default(sql`'[]'::jsonb`),
    books: jsonb("books")
      .$type<BookCard[]>()
      .default(sql`'[]'::jsonb`),
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
    uniqueIndex("posts_slug_idx").on(table.slug),
    index("posts_status_idx").on(table.status),
    index("posts_created_at_idx").on(table.createdAt),
  ],
);

export type PostSelect = typeof posts.$inferSelect;
export type PostInsert = typeof posts.$inferInsert;
