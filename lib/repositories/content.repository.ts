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
  PasskeyItem,
  UserSession,
  NewsletterSubscriber,
} from '@/lib/types';

// Repository contract for data access. UI components call the service layer,
// which interacts with Supabase through this interface.

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

  // Passkeys & Auth
  getPasskeys(userId: string): Promise<PasskeyItem[]>;
  savePasskey(userId: string, passkey: PasskeyItem): Promise<PasskeyItem>;
  deletePasskey(userId: string, passkeyId: string): Promise<boolean>;

  // Active Sessions
  getSessions(userId: string, currentSessionId?: string): Promise<UserSession[]>;
  recordSession(session: UserSession): Promise<UserSession>;
  deleteSession(userId: string, sessionId: string): Promise<boolean>;
  deleteAllSessions(userId: string): Promise<boolean>;

  // Connected Accounts
  getConnectedProviders(userId: string): Promise<string[]>;
  setConnectedProviders(userId: string, providers: string[]): Promise<void>;

  // Newsletter Subscribers
  addSubscriber(email: string, source?: string): Promise<NewsletterSubscriber>;
  getSubscribers(): Promise<NewsletterSubscriber[]>;
  deleteSubscriber(id: string): Promise<boolean>;
}
