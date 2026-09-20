import {
  pgTable,
  text,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    src: text("src").notNull(),
    alt: text("alt").notNull().default(""),
    size: text("size").notNull().default(""),
    dimensions: text("dimensions"),
    uploadedAt: date("uploaded_at"),
    tag: text("tag").default(""),
    tags: text("tags")
      .array()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("media_created_at_idx").on(table.createdAt),
    index("media_src_idx").on(table.src),
  ],
);

export type MediaSelect = typeof media.$inferSelect;
export type MediaInsert = typeof media.$inferInsert;
