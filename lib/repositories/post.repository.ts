import type { BlogPost, Persona } from "@/lib/types";

export interface PostRepository {
  getPost(slug: string): Promise<BlogPost | null>;
  getPostSlugs(): Promise<string[]>;
  getAllPosts(): Promise<BlogPost[]>;
  savePost(post: BlogPost, persona?: Persona): Promise<BlogPost>;
  deletePost(slug: string): Promise<boolean>;
  togglePostStatus(slug: string): Promise<BlogPost | null>;
  getFeaturedPosts(): Promise<string[]>;
  setFeaturedPosts(slugs: string[]): Promise<void>;
}
