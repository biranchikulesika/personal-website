import { OperatorFocus } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class OperatorFocusService {
  private repository: IRepository<OperatorFocus>;

  constructor() {
    this.repository = repositoryRegistry.getOperatorFocusRepository();
  }

  async getAll(): Promise<OperatorFocus[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get operatorFocuss:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<OperatorFocus | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get operatorFocus:", error);
      throw error;
    }
  }

  async create(data: Omit<OperatorFocus, "id">): Promise<OperatorFocus | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create operatorFocus:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<OperatorFocus>): Promise<OperatorFocus | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update operatorFocus:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete operatorFocus:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<OperatorFocus | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<OperatorFocus>);
    } catch (error) {
      console.error("Failed to hide operatorFocus:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<OperatorFocus | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<OperatorFocus>);
    } catch (error) {
      console.error("Failed to unhide operatorFocus:", error);
      throw error;
    }
  }

  async reorder(ids: string[]): Promise<boolean> {
    try {
      for (let i = 0; i < ids.length; i++) {
        await this.repository.update(ids[i], { order: i } as Partial<OperatorFocus>);
      }
      return true;
    } catch (error) {
      console.error("Failed to reorder operatorFocuss:", error);
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
