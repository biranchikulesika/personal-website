import type {
  AppRole,
  UserRole,
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
  ScribbleEntry,
  HomeContent,
  SectionGroup,
  SiteContent,
  WritingItem,
} from '@/lib/types';
import { getContentRepository } from '@/lib/repositories';
import type { ContentRepository } from '@/lib/repositories/content.repository';
import { SITE_CONFIG } from '@/lib/config/site';

// Application layer for site content. Components and pages ask for content
// by intent (getSiteContent, getWriting, ...) and never import the mock
// database directly. The concrete repository is swappable.

export class ContentService {
  constructor(private repo: ContentRepository = getContentRepository()) {}

  getSiteContent(): SiteContent {
    return SITE_CONFIG;
  }

  getHomeContent(): Promise<HomeContent> {
    return this.repo.getHomeContent();
  }

  getWriting(): Promise<SectionGroup<WritingItem>> {
    return this.repo.getWriting();
  }

  getLibrary(): Promise<SectionGroup<BookItem>> {
    return this.repo.getLibrary();
  }

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

  getNote(slug: string): Promise<NoteItem | null> {
    return this.repo.getNote(slug);
  }

  getNoteSlugs(): Promise<string[]> {
    return this.repo.getNoteSlugs();
  }

  getAllNotes(): Promise<NoteItem[]> {
    return this.repo.getAllNotes();
  }

  saveNote(note: NoteItem): Promise<NoteItem> {
    return this.repo.saveNote(note);
  }

  deleteNote(slug: string): Promise<boolean> {
    return this.repo.deleteNote(slug);
  }

  toggleNoteStatus(slug: string): Promise<NoteItem | null> {
    return this.repo.toggleNoteStatus(slug);
  }

  getAllBooks(): Promise<BookItem[]> {
    return this.repo.getAllBooks();
  }

  saveBook(book: BookItem): Promise<BookItem> {
    return this.repo.saveBook(book);
  }

  deleteBook(slug: string): Promise<boolean> {
    return this.repo.deleteBook(slug);
  }

  getNowEntries(): Promise<NowEntry[]> {
    return this.repo.getNowEntries();
  }

  saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    return this.repo.saveNowEntry(entry);
  }

  deleteNowEntry(id: string): Promise<boolean> {
    return this.repo.deleteNowEntry(id);
  }

  getScribbleEntries(): Promise<ScribbleEntry[]> {
    return this.repo.getScribbleEntries();
  }

  getMedia(): Promise<MediaItem[]> {
    return this.repo.getMedia();
  }

  addMedia(item: MediaItem): Promise<MediaItem> {
    return this.repo.addMedia(item);
  }

  deleteMedia(id: string): Promise<boolean> {
    return this.repo.deleteMedia(id);
  }

  getOrphanedMedia(): Promise<MediaItem[]> {
    return this.repo.getOrphanedMedia();
  }

  deleteStorageAssets(srcs: string[]): Promise<number> {
    return this.repo.deleteStorageAssets(srcs);
  }

  getUserRole(userId: string): Promise<AppRole | null> {
    return this.repo.getUserRole(userId);
  }

  setUserRole(userId: string, role: AppRole): Promise<void> {
    return this.repo.setUserRole(userId, role);
  }

  getAllUserRoles(): Promise<UserRole[]> {
    return this.repo.getAllUserRoles();
  }

  getFeaturedPosts(): Promise<string[]> {
    return this.repo.getFeaturedPosts();
  }

  getFeaturedBooks(): Promise<string[]> {
    return this.repo.getFeaturedBooks();
  }

  setFeaturedPosts(slugs: string[]): Promise<void> {
    return this.repo.setFeaturedPosts(slugs);
  }

  setFeaturedBooks(slugs: string[]): Promise<void> {
    return this.repo.setFeaturedBooks(slugs);
  }
}