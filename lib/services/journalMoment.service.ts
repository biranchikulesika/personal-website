import { JournalMoment } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class JournalMomentService {
  private repository: IRepository<JournalMoment>;

  constructor() {
    this.repository = repositoryRegistry.getJournalMomentRepository();
  }

  async getAll(): Promise<JournalMoment[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get journalMoments:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<JournalMoment | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get journalMoment:", error);
      throw error;
    }
  }

  async create(data: Omit<JournalMoment, "id">): Promise<JournalMoment | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create journalMoment:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<JournalMoment>): Promise<JournalMoment | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update journalMoment:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete journalMoment:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<JournalMoment | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<JournalMoment>);
    } catch (error) {
      console.error("Failed to hide journalMoment:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<JournalMoment | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<JournalMoment>);
    } catch (error) {
      console.error("Failed to unhide journalMoment:", error);
      throw error;
    }
  }
}
