import type { ContentRepository } from './content.repository';
import { SupabaseContentRepository } from './supabase-content.repository';

let repository: ContentRepository | null = null;

export function getContentRepository(): ContentRepository {
  if (!repository) {
    repository = new SupabaseContentRepository();
  }
  return repository;
}

export function setContentRepositoryForTesting(repo: ContentRepository | null): void {
  repository = repo;
}

export { SupabaseContentRepository };
export type { ContentRepository };
