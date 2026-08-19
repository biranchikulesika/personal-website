import { getDatabase } from '@/lib/data/mock-db';
import { getDataSource } from '@/lib/config/env';
import type { Entry } from '@/lib/types';
import { MockRepository } from './mock.repository';
import type { Repository } from './repository';
import type { ContentRepository } from './content.repository';
import { MockContentRepository } from './mock-content.repository';

const COLLECTION = 'entries';

export function getEntryRepository(): Repository<Entry> {
  return new MockRepository<Entry>(getDatabase(), COLLECTION);
}

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