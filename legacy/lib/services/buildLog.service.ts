import { BuildLog } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class BuildLogService {
  private repository: IRepository<BuildLog>;

  constructor() {
    this.repository = repositoryRegistry.getBuildLogRepository();
  }

  async getAll(): Promise<BuildLog[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get buildLogs:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<BuildLog | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get buildLog:", error);
      throw error;
    }
  }

  async create(data: Omit<BuildLog, "id">): Promise<BuildLog | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create buildLog:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<BuildLog>): Promise<BuildLog | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update buildLog:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete buildLog:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<BuildLog | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<BuildLog>);
    } catch (error) {
      console.error("Failed to hide buildLog:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<BuildLog | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<BuildLog>);
    } catch (error) {
      console.error("Failed to unhide buildLog:", error);
      throw error;
    }
  }
}
