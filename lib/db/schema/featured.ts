import {
  pgTable,
  text,
  integer,
  uuid,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const featuredItems = pgTable(
  "featured_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    itemType: text("item_type").notNull(),
    itemId: text("item_id").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("featured_items_type_idx").on(table.itemType),
    index("featured_items_pos_idx").on(table.position),
  ],
);

export type FeaturedItemSelect = typeof featuredItems.$inferSelect;
export type FeaturedItemInsert = typeof featuredItems.$inferInsert;
