import type { ContentRepository } from "./content.repository";
import { DrizzleContentRepository } from "./drizzle-content.repository";
import { SupabaseContentRepository } from "./supabase-content.repository";
import { getDatabaseUrl } from "@/lib/config/env";

export * from "./content.repository";
export * from "./drizzle-content.repository";
export * from "./supabase-content.repository";

let repository: ContentRepository | null = null;

export function getContentRepository(): ContentRepository {
  if (!repository) {
    const dbUrl = getDatabaseUrl();
    if (dbUrl) {
      repository = new DrizzleContentRepository();
    } else {
      repository = new SupabaseContentRepository();
    }
  }
  return repository;
}

export function setContentRepositoryForTesting(
  repo: ContentRepository | null,
): void {
  repository = repo;
}
