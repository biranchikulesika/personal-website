import { NewsletterIssue } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class NewsletterIssueService {
  private repository: IRepository<NewsletterIssue>;

  constructor() {
    this.repository = repositoryRegistry.getNewsletterIssueRepository();
  }

  async getAll(): Promise<NewsletterIssue[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get newsletterIssues:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<NewsletterIssue | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get newsletterIssue:", error);
      throw error;
    }
  }

  async create(data: Omit<NewsletterIssue, "id">): Promise<NewsletterIssue | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create newsletterIssue:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<NewsletterIssue>): Promise<NewsletterIssue | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update newsletterIssue:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete newsletterIssue:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<NewsletterIssue | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<NewsletterIssue>);
    } catch (error) {
      console.error("Failed to hide newsletterIssue:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<NewsletterIssue | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<NewsletterIssue>);
    } catch (error) {
      console.error("Failed to unhide newsletterIssue:", error);
      throw error;
    }
  }
}
