import type {
  AdminProfile,
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
  ScribbleEntry,
  HomeContent,
  PageContent,
  SectionGroup,
  SiteContent,
  WritingItem,
} from '@/lib/types';

// Repository contract for content. The UI (via the service layer) asks for
// content by intent and never knows whether it comes from the mock database
// or a real one. Swapping data sources later means swapping this
// implementation, nothing else.

export interface ContentRepository {
  getSiteContent(): Promise<SiteContent>;
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

  getPage(slug: string): Promise<PageContent | null>;
  getScribbleEntries(): Promise<ScribbleEntry[]>;

  getNowEntries(): Promise<NowEntry[]>;
  saveNowEntry(entry: NowEntry): Promise<NowEntry>;
  deleteNowEntry(id: string): Promise<boolean>;

  getMedia(): Promise<MediaItem[]>;
  addMedia(item: MediaItem): Promise<MediaItem>;
  deleteMedia(id: string): Promise<boolean>;
  getOrphanedMedia(): Promise<MediaItem[]>;
  deleteStorageAssets(srcs: string[]): Promise<number>;

  getAdminProfile(): Promise<AdminProfile>;
  updateAdminProfile(profile: Partial<AdminProfile>): Promise<AdminProfile>;
}