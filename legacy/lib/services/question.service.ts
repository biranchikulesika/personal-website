import { Question } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class QuestionService {
  private repository: IRepository<Question>;

  constructor() {
    this.repository = repositoryRegistry.getQuestionRepository();
  }

  async getAll(): Promise<Question[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get questions:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<Question | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get question:", error);
      throw error;
    }
  }

  async create(data: Omit<Question, "id">): Promise<Question | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create question:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Question>): Promise<Question | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update question:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete question:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<Question | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<Question>);
    } catch (error) {
      console.error("Failed to hide question:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<Question | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<Question>);
    } catch (error) {
      console.error("Failed to unhide question:", error);
      throw error;
    }
  }

  async reorder(ids: string[]): Promise<boolean> {
    try {
      for (let i = 0; i < ids.length; i++) {
        await this.repository.update(ids[i], { order: i } as Partial<Question>);
      }
      return true;
    } catch (error) {
      console.error("Failed to reorder questions:", error);
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
