import { RedistributionRecord } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class RedistributionRecordService {
  private repository: IRepository<RedistributionRecord>;

  constructor() {
    this.repository = repositoryRegistry.getRedistributionRecordRepository();
  }

  async getAll(): Promise<RedistributionRecord[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get redistributionRecords:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<RedistributionRecord | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get redistributionRecord:", error);
      throw error;
    }
  }

  async create(data: Omit<RedistributionRecord, "id">): Promise<RedistributionRecord | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create redistributionRecord:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<RedistributionRecord>): Promise<RedistributionRecord | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update redistributionRecord:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete redistributionRecord:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<RedistributionRecord | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<RedistributionRecord>);
    } catch (error) {
      console.error("Failed to hide redistributionRecord:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<RedistributionRecord | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<RedistributionRecord>);
    } catch (error) {
      console.error("Failed to unhide redistributionRecord:", error);
      throw error;
    }
  }
}
