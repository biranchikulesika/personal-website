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

  // Reuse existing connection pool across hot reloads in development
  let client: postgres.Sql;

  if (process.env.NODE_ENV === "production") {
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  } else {
    if (!globalThis.__drizzleSqlInstance) {
      globalThis.__drizzleSqlInstance = postgres(connectionString, {
        max: 5,
        idle_timeout: 20,
        connect_timeout: 10,
      });
    }
    client = globalThis.__drizzleSqlInstance;
  }

  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof getDbClient>;
