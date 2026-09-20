import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appRoleEnum = pgEnum("app_role", [
  "user",
  "content_admin",
  "super_admin",
]);

export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").primaryKey(),
  role: appRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type UserRoleSelect = typeof userRoles.$inferSelect;
export type UserRoleInsert = typeof userRoles.$inferInsert;
