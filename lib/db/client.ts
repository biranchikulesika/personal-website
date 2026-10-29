import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseUrl } from "@/lib/config/env";

declare global {
  var __drizzleSqlInstance: postgres.Sql | undefined;
}

export function getDbClient() {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Please set DATABASE_URL in your environment variables.",
    );
  }

  // One pool per process. The repository creates the client on every query, so
  // a fresh pool per call would exhaust Postgres connections in production.
  if (!globalThis.__drizzleSqlInstance) {
    globalThis.__drizzleSqlInstance = postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  return drizzle(globalThis.__drizzleSqlInstance, { schema });
}

export type DbClient = ReturnType<typeof getDbClient>;
