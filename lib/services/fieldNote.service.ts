import { FieldNote } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class FieldNoteService {
  private repository: IRepository<FieldNote>;

  constructor() {
    this.repository = repositoryRegistry.getFieldNoteRepository();
  }

  async getAll(): Promise<FieldNote[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get fieldNotes:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<FieldNote | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get fieldNote:", error);
      throw error;
    }
  }

  async create(data: Omit<FieldNote, "id">): Promise<FieldNote | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create fieldNote:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<FieldNote>): Promise<FieldNote | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update fieldNote:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete fieldNote:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<FieldNote | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<FieldNote>);
    } catch (error) {
      console.error("Failed to hide fieldNote:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<FieldNote | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<FieldNote>);
    } catch (error) {
      console.error("Failed to unhide fieldNote:", error);
      throw error;
    }
  }

  async feature(id: string): Promise<FieldNote | null> {
    try {
      return await this.repository.update(id, { featured: true } as Partial<FieldNote>);
    } catch (error) {
      console.error("Failed to feature fieldNote:", error);
      throw error;
    }
  }

  async unfeature(id: string): Promise<FieldNote | null> {
    try {
      return await this.repository.update(id, { featured: false } as Partial<FieldNote>);
    } catch (error) {
      console.error("Failed to unfeature fieldNote:", error);
      throw error;
    }
  }
}
