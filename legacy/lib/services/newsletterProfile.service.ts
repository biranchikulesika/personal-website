import { NewsletterProfile } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class NewsletterProfileService {
  private repository: IRepository<NewsletterProfile>;

  constructor() {
    this.repository = repositoryRegistry.getNewsletterProfileRepository();
  }

  async getAll(): Promise<NewsletterProfile[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get newsletterProfiles:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<NewsletterProfile | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get newsletterProfile:", error);
      throw error;
    }
  }

  async create(data: Omit<NewsletterProfile, "id">): Promise<NewsletterProfile | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create newsletterProfile:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<NewsletterProfile>): Promise<NewsletterProfile | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update newsletterProfile:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete newsletterProfile:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<NewsletterProfile | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<NewsletterProfile>);
    } catch (error) {
      console.error("Failed to hide newsletterProfile:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<NewsletterProfile | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<NewsletterProfile>);
    } catch (error) {
      console.error("Failed to unhide newsletterProfile:", error);
      throw error;
    }
  }
}
