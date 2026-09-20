import { getContentRepository } from "@/lib/repositories";
import type { PostRepository } from "@/lib/repositories/post.repository";
import type { BlogPost, Persona } from "@/lib/types";

export class PostService {
  constructor(private repo: PostRepository = getContentRepository()) {}

  getPost(slug: string): Promise<BlogPost | null> {
    return this.repo.getPost(slug);
  }

  getPostSlugs(): Promise<string[]> {
    return this.repo.getPostSlugs();
  }

  getAllPosts(): Promise<BlogPost[]> {
    return this.repo.getAllPosts();
  }

  savePost(post: BlogPost, persona?: Persona): Promise<BlogPost> {
    return this.repo.savePost(post, persona);
  }

  deletePost(slug: string): Promise<boolean> {
    return this.repo.deletePost(slug);
  }

  togglePostStatus(slug: string): Promise<BlogPost | null> {
    return this.repo.togglePostStatus(slug);
  }

  getFeaturedPosts(): Promise<string[]> {
    return this.repo.getFeaturedPosts();
  }

  setFeaturedPosts(slugs: string[]): Promise<void> {
    return this.repo.setFeaturedPosts(slugs);
  }
}
