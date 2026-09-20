import type { BookItem, SectionGroup } from "@/lib/types";

export interface BookRepository {
  getAllBooks(): Promise<BookItem[]>;
  getLibrary(): Promise<SectionGroup<BookItem>>;
  saveBook(book: BookItem): Promise<BookItem>;
  deleteBook(slug: string): Promise<boolean>;
  toggleBookStatus(slug: string): Promise<BookItem | null>;
  getFeaturedBooks(): Promise<string[]>;
  setFeaturedBooks(slugs: string[]): Promise<void>;
}
