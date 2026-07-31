import { Donation } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class DonationService {
  private repository: IRepository<Donation>;

  constructor() {
    this.repository = repositoryRegistry.getDonationRepository();
  }

  async getAll(): Promise<Donation[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get donations:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<Donation | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get donation:", error);
      throw error;
    }
  }

  async create(data: Omit<Donation, "id">): Promise<Donation | null> {
    try {
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create donation:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Donation>): Promise<Donation | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update donation:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete donation:", error);
      throw error;
    }
  }
}
