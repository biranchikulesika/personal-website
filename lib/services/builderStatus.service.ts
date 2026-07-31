import { BuilderStatus } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class BuilderStatusService {
  private repository: IRepository<BuilderStatus>;

  constructor() {
    this.repository = repositoryRegistry.getBuilderStatusRepository();
  }

  async getAll(): Promise<BuilderStatus[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get builderStatuss:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<BuilderStatus | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get builderStatus:", error);
      throw error;
    }
  }

  async create(data: Omit<BuilderStatus, "id">): Promise<BuilderStatus | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create builderStatus:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<BuilderStatus>): Promise<BuilderStatus | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update builderStatus:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete builderStatus:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<BuilderStatus | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<BuilderStatus>);
    } catch (error) {
      console.error("Failed to hide builderStatus:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<BuilderStatus | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<BuilderStatus>);
    } catch (error) {
      console.error("Failed to unhide builderStatus:", error);
      throw error;
    }
  }
}
