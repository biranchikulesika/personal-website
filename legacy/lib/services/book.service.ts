import { Book } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class BookService {
  private repository: IRepository<Book>;

  constructor() {
    this.repository = repositoryRegistry.getBookRepository();
  }

  async getAll(): Promise<Book[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error("Failed to get books:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<Book | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get book:", error);
      throw error;
    }
  }

  async create(data: Omit<Book, "id">): Promise<Book | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create book:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Book>): Promise<Book | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update book:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete book:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<Book | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<Book>);
    } catch (error) {
      console.error("Failed to hide book:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<Book | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<Book>);
    } catch (error) {
      console.error("Failed to unhide book:", error);
      throw error;
    }
  }

  async feature(id: string): Promise<Book | null> {
    try {
      return await this.repository.update(id, { featured: true } as Partial<Book>);
    } catch (error) {
      console.error("Failed to feature book:", error);
      throw error;
    }
  }

  async unfeature(id: string): Promise<Book | null> {
    try {
      return await this.repository.update(id, { featured: false } as Partial<Book>);
    } catch (error) {
      console.error("Failed to unfeature book:", error);
      throw error;
    }
  }
}
