import { getDataSource } from '@/lib/config/env';
import type { ContentRepository } from './content.repository';
import { MockContentRepository } from './mock-content.repository';
import { getDatabase } from '@/lib/data/mock-db';
import { SupabaseContentRepository } from './supabase-content.repository';

let repository: ContentRepository | null = null;

export function getContentRepository(): ContentRepository {
  // Return cached instance — the repository is stateless and safe to reuse.
  if (repository) return repository;

  const source = getDataSource();

  switch (source) {
    case 'mock':
      repository = new MockContentRepository(getDatabase());
      break;
    case 'supabase':
      repository = new SupabaseContentRepository();
      break;
    default:
      throw new Error(`No content repository configured for data source: "${source}"`);
  }

  return repository;
}
