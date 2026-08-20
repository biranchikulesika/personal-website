import { getDatabase } from '@/lib/data/mock-db';
import { getDataSource } from '@/lib/config/env';
import type { ContentRepository } from './content.repository';
import { MockContentRepository } from './mock-content.repository';

export function getContentRepository(): ContentRepository {
  const source = getDataSource();
  switch (source) {
    case 'mock':
      return new MockContentRepository(getDatabase());
    default:
      // Unreachable — getDataSource() throws for any production source.
      throw new Error(`No content repository configured for data source: ${source}`);
  }
}