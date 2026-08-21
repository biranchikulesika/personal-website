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
  WritingItem,
  Contribution,
} from '@/lib/types';

// Repository contract for content. The UI (via the service layer) asks for
// content by intent and never knows whether it comes from the mock database
// or a real one. Swapping data sources later means swapping this
// implementation, nothing else.

export interface ContentRepository {
  getHomeContent(): Promise<HomeContent>;
  getWriting(): Promise<SectionGroup<WritingItem>>;
  getLibrary(): Promise<SectionGroup<BookItem>>;
  getPost(slug: string): Promise<BlogPost | null>;
  getPostSlugs(): Promise<string[]>;
  getAllPosts(): Promise<BlogPost[]>;
  savePost(post: BlogPost, persona?: Persona): Promise<BlogPost>;
  deletePost(slug: string): Promise<boolean>;
  togglePostStatus(slug: string): Promise<BlogPost | null>;

  getNote(slug: string): Promise<NoteItem | null>;
  getNoteSlugs(): Promise<string[]>;
  getAllNotes(): Promise<NoteItem[]>;
  saveNote(note: NoteItem): Promise<NoteItem>;
  deleteNote(slug: string): Promise<boolean>;
  toggleNoteStatus(slug: string): Promise<NoteItem | null>;

  getAllBooks(): Promise<BookItem[]>;
  saveBook(book: BookItem): Promise<BookItem>;
  deleteBook(slug: string): Promise<boolean>;

  getScribbleEntries(): Promise<ScribbleEntry[]>;

  getNowEntries(): Promise<NowEntry[]>;
  saveNowEntry(entry: NowEntry): Promise<NowEntry>;
  deleteNowEntry(id: string): Promise<boolean>;

  getMedia(): Promise<MediaItem[]>;
  addMedia(item: MediaItem): Promise<MediaItem>;
  deleteMedia(id: string): Promise<boolean>;
  getOrphanedMedia(): Promise<MediaItem[]>;
  deleteStorageAssets(srcs: string[]): Promise<number>;

  getUserRole(userId: string): Promise<AppRole | null>;
  setUserRole(userId: string, role: AppRole): Promise<void>;
  getAllUserRoles(): Promise<UserRole[]>;

  getFeaturedPosts(): Promise<string[]>;
  getFeaturedBooks(): Promise<string[]>;
  setFeaturedPosts(slugs: string[]): Promise<void>;
  setFeaturedBooks(slugs: string[]): Promise<void>;

  // Contributions & Patronage
  recordContribution(contribution: Contribution): Promise<Contribution>;
  getContribution(id: string): Promise<Contribution | null>;
  getContributions(): Promise<Contribution[]>;
}
