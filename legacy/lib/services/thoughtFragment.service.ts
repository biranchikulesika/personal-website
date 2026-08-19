import { ThoughtFragment } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class ThoughtFragmentService {
  private repository: IRepository<ThoughtFragment>;

  constructor() {
    this.repository = repositoryRegistry.getThoughtFragmentRepository();
  }

  async getAll(): Promise<ThoughtFragment[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get thoughtFragments:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<ThoughtFragment | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get thoughtFragment:", error);
      throw error;
    }
  }

  async create(data: Omit<ThoughtFragment, "id">): Promise<ThoughtFragment | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create thoughtFragment:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<ThoughtFragment>): Promise<ThoughtFragment | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update thoughtFragment:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete thoughtFragment:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<ThoughtFragment | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<ThoughtFragment>);
    } catch (error) {
      console.error("Failed to hide thoughtFragment:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<ThoughtFragment | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<ThoughtFragment>);
    } catch (error) {
      console.error("Failed to unhide thoughtFragment:", error);
      throw error;
    }
  }

  async moveUp(id: string): Promise<boolean> {
    try {
      const all = await this.getAll();
      all.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      const idx = all.findIndex((x: any) => x.id === id);
      if (idx <= 0) return false;
      const current = all[idx] as any;
      const prev = all[idx - 1] as any;
      const t = current.order || idx;
      await this.update(current.id, { order: prev.order || (idx - 1) } as any);
      await this.update(prev.id, { order: t } as any);
      return true;
    } catch { return false; }
  }

  async moveDown(id: string): Promise<boolean> {
    try {
      const all = await this.getAll();
      all.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      const idx = all.findIndex((x: any) => x.id === id);
      if (idx === -1 || idx >= all.length - 1) return false;
      const current = all[idx] as any;
      const next = all[idx + 1] as any;
      const t = current.order || idx;
      await this.update(current.id, { order: next.order || (idx + 1) } as any);
      await this.update(next.id, { order: t } as any);
      return true;
    } catch { return false; }
  }

}
