import { getEntryRepository } from '@/lib/repositories';
import type { Repository } from '@/lib/repositories/repository';
import type { Entry } from '@/lib/types';

export class EntryService {
  private readonly repository: Repository<Entry>;

  constructor(repository: Repository<Entry> = getEntryRepository()) {
    this.repository = repository;
  }

  async list(): Promise<Entry[]> {
    return this.repository.getAll();
  }

  async getBySlug(slug: string): Promise<Entry | null> {
    return this.repository.getBySlug(slug);
  }

  async getById(id: string): Promise<Entry | null> {
    return this.repository.getById(id);
  }
}