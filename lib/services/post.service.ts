import { Post } from "../types";
import { repositoryRegistry, IRepository } from '../repositories/registry';

export class PostService {
  private repository: IRepository<Post>;

  constructor() {
    this.repository = repositoryRegistry.getPostRepository();
  }

  async getAll(searchQuery?: string): Promise<Post[]> {
    try {
      return await (this.repository as any).getAll(searchQuery);
    } catch (error) {
      console.error("Failed to get posts:", error);
      throw error;
    }
  }

  async getAllMeta(searchQuery?: string): Promise<Post[]> {
    try {
      if ((this.repository as any).getAllMeta) {
        return await (this.repository as any).getAllMeta(searchQuery);
      }
      const all = await this.getAll(searchQuery);
      // Remove content if repository fallback is used
      return all.map((p) => {
        const { content, ...meta } = p;
        return meta as Post;
      });
    } catch (error) {
      console.error("Failed to get posts meta:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<Post | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error("Failed to get post:", error);
      throw error;
    }
  }

  async getBySlug(slug: string, persona?: string): Promise<Post | null> {
    try {
      return await (this.repository as any).getBySlug(slug, persona);
    } catch (error) {
      console.error("Failed to get post by slug:", error);
      throw error;
    }
  }

  async checkSlugExists(slug: string, currentId: string | null, persona: string): Promise<boolean> {
    try {
      if ((this.repository as any).checkSlugExists) {
        return await (this.repository as any).checkSlugExists(slug, currentId, persona);
      }
      const all = await this.repository.getAll();
      return all.some(p => p.slug === slug && p.id !== currentId && p.persona === persona);
    } catch (error) {
      console.error("Failed to check slug exists:", error);
      throw error;
    }
  }

  async create(data: Omit<Post, "id">): Promise<Post | null> {
    try {
      // Add validation logic here
      return await this.repository.create(data);
    } catch (error) {
      console.error("Failed to create post:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error("Failed to update post:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error("Failed to delete post:", error);
      throw error;
    }
  }
  
  async hide(id: string): Promise<Post | null> {
    try {
      return await this.repository.update(id, { hidden: true } as Partial<Post>);
    } catch (error) {
      console.error("Failed to hide post:", error);
      throw error;
    }
  }

  async unhide(id: string): Promise<Post | null> {
    try {
      return await this.repository.update(id, { hidden: false } as Partial<Post>);
    } catch (error) {
      console.error("Failed to unhide post:", error);
      throw error;
    }
  }

  async feature(id: string): Promise<Post | null> {
    try {
      return await this.repository.update(id, { featured: true } as Partial<Post>);
    } catch (error) {
      console.error("Failed to feature post:", error);
      throw error;
    }
  }

  async unfeature(id: string): Promise<Post | null> {
    try {
      return await this.repository.update(id, { featured: false } as Partial<Post>);
    } catch (error) {
      console.error("Failed to unfeature post:", error);
      throw error;
    }
  }
}
