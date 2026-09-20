import {
  pgTable,
  text,
  uuid,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const storageFiles = pgTable("storage_files", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  path: text("path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type StorageFileSelect = typeof storageFiles.$inferSelect;
export type StorageFileInsert = typeof storageFiles.$inferInsert;
