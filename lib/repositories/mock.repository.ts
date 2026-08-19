import type { MockDatabase } from '@/lib/data/mock-db';
import type { Repository } from './repository';

export class MockRepository<T extends { id: string; slug: string }>
  implements Repository<T>
{
  constructor(
    private readonly db: MockDatabase,
    private readonly collection: 'entries'
  ) {}

  async getAll(): Promise<T[]> {
    return [...(this.db[this.collection] as unknown as T[])];
  }

  async getById(id: string): Promise<T | null> {
    const item = (this.db[this.collection] as unknown as T[]).find(
      (entry) => entry.id === id
    );
    return item ? { ...item } : null;
  }

  async getBySlug(slug: string): Promise<T | null> {
    const item = (this.db[this.collection] as unknown as T[]).find(
      (entry) => entry.slug === slug
    );
    return item ? { ...item } : null;
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const id = crypto.randomUUID();
    const item = { ...data, id } as T;
    (this.db[this.collection] as unknown as T[]).push(item);
    return { ...item };
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const items = this.db[this.collection] as unknown as T[];
    const index = items.findIndex((entry) => entry.id === id);
    if (index === -1) return null;
    const updated = { ...items[index], ...data, id } as T;
    items[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const items = this.db[this.collection] as unknown as T[];
    const index = items.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    return true;
  }
}