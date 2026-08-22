import type { ContentRepository } from "../lib/repositories/content.repository";
import type {
  AppRole,
  BlogPost,
  BookItem,
  Contribution,
  HomeContent,
  MediaItem,
  NewsletterSubscriber,
  NoteItem,
  NowEntry,
  PasskeyItem,
  Persona,
  ScribbleEntry,
  SectionGroup,
  UserRole,
  UserSession,
  WritingItem,
} from "../lib/types";

export class InMemoryTestContentRepository implements ContentRepository {
  public posts: BlogPost[] = [];
  public notes: NoteItem[] = [];
  public books: BookItem[] = [];
  public nowEntries: NowEntry[] = [];
  public media: MediaItem[] = [];
  public storage: string[] = [];
  public userRoles: UserRole[] = [];
  public contributions: Contribution[] = [];
  public passkeys: PasskeyItem[] = [];
  public sessions: UserSession[] = [];
  public connectedProviders: Record<string, string[]> = { default: ["google"] };
  public featuredPosts: string[] = [];
  public featuredBooks: string[] = [];
  public subscribers: NewsletterSubscriber[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.posts = [];
    this.notes = [];
    this.books = [];
    this.nowEntries = [];
    this.subscribers = [];
    this.media = [
      {
        id: "media-001",
        name: "biranchi.jpeg",
        src: "/biranchi.jpeg",
        alt: "Biranchi Kulesika Portrait",
        size: "210 KB",
        dimensions: "900 × 1600",
        uploadedAt: "2026-08-19",
        tag: "profile",
      },
    ];
    this.storage = ["/biranchi.jpeg"];
    this.userRoles = [];
    this.contributions = [];
    this.passkeys = [
      {
        id: "pk-1",
        label: "Linux Computer",
        createdAt: "2026-08-14T12:00:00.000Z",
        lastUsedAt: "Aug 14, 2026",
        credentialId: "cred-linux-fido2",
      },
    ];
    this.sessions = [
      {
        id: "sess-current",
        userId: "default",
        device: "Linux Computer / Chrome",
        location: "127.0.0.1 (Local)",
        ipAddress: "127.0.0.1",
        startedAt: "Just now",
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
      },
    ];
    this.connectedProviders = { default: ["google"] };
    this.featuredPosts = [];
    this.featuredBooks = [];
  }

  async getHomeContent(): Promise<HomeContent> {
    const writing = await this.getWriting();
    const allNotes = await this.getAllNotes();
    const library = await this.getLibrary();

    return {
      writing,
      notes: {
        title: "Notes",
        href: "/scribble",
        subheader:
          "Things I want to share, stories, opinions, observations, and thoughts.",
        items: allNotes.filter((n) => n.status !== "unpublished"),
      },
      library,
    };
  }

  async getWriting(): Promise<SectionGroup<WritingItem>> {
    const published = this.posts.filter((p) => p.status !== "unpublished");
    return {
      title: "Writing",
      href: "/scribble",
      subheader: "Thoughts and ideas I want to explore and explain",
      items: published.map((p) => ({
        id: p.slug,
        slug: p.slug,
        title: p.title,
        description: p.description,
        date: p.publishedAt,
        persona: p.persona ?? "builder",
        tags: p.tags,
        status: p.status,
      })),
    };
  }

  async getLibrary(): Promise<SectionGroup<BookItem>> {
    return {
      title: "Library",
      href: "/library",
      subheader: "Books that shaped my thinking",
      items: [...this.books],
    };
  }

  async getPost(slug: string): Promise<BlogPost | null> {
    return this.posts.find((p) => p.slug === slug) ?? null;
  }

  async getPostSlugs(): Promise<string[]> {
    return this.posts
      .filter((p) => p.status !== "unpublished")
      .map((p) => p.slug);
  }

  async getAllPosts(): Promise<BlogPost[]> {
    return [...this.posts];
  }

  async savePost(
    post: BlogPost,
    persona: Persona = "builder",
  ): Promise<BlogPost> {
    const index = this.posts.findIndex((p) => p.slug === post.slug);
    const item: BlogPost = {
      ...post,
      persona: post.persona ?? persona,
      status: post.status || "published",
    };
    if (index >= 0) {
      this.posts[index] = item;
    } else {
      this.posts.unshift(item);
    }
    return item;
  }

  async deletePost(slug: string): Promise<boolean> {
    const index = this.posts.findIndex((p) => p.slug === slug);
    if (index < 0) return false;
    this.posts.splice(index, 1);
    return true;
  }

  async togglePostStatus(slug: string): Promise<BlogPost | null> {
    const post = this.posts.find((p) => p.slug === slug);
    if (!post) return null;
    post.status = post.status === "unpublished" ? "published" : "unpublished";
    return { ...post };
  }

  async getNote(slug: string): Promise<NoteItem | null> {
    return this.notes.find((n) => n.slug === slug) ?? null;
  }

  async getNoteSlugs(): Promise<string[]> {
    return this.notes
      .filter((n) => n.status !== "unpublished")
      .map((n) => n.slug);
  }

  async getAllNotes(): Promise<NoteItem[]> {
    return [...this.notes];
  }

  async saveNote(note: NoteItem): Promise<NoteItem> {
    const index = this.notes.findIndex((n) => n.slug === note.slug);
    const item: NoteItem = {
      ...note,
      status: note.status || "published",
    };
    if (index >= 0) {
      this.notes[index] = item;
    } else {
      this.notes.unshift(item);
    }
    return item;
  }

  async deleteNote(slug: string): Promise<boolean> {
    const index = this.notes.findIndex((n) => n.slug === slug);
    if (index < 0) return false;
    this.notes.splice(index, 1);
    return true;
  }

  async toggleNoteStatus(slug: string): Promise<NoteItem | null> {
    const note = this.notes.find((n) => n.slug === slug);
    if (!note) return null;
    note.status = note.status === "unpublished" ? "published" : "unpublished";
    return { ...note };
  }

  async getAllBooks(): Promise<BookItem[]> {
    return [...this.books];
  }

  async saveBook(book: BookItem): Promise<BookItem> {
    const index = this.books.findIndex((b) => b.slug === book.slug);
    if (index >= 0) {
      this.books[index] = { ...book };
    } else {
      this.books.unshift({ ...book });
    }
    return book;
  }

  async deleteBook(slug: string): Promise<boolean> {
    const index = this.books.findIndex((b) => b.slug === slug);
    if (index < 0) return false;
    this.books.splice(index, 1);
    return true;
  }

  async getScribbleEntries(): Promise<ScribbleEntry[]> {
    const essays: ScribbleEntry[] = this.posts
      .filter((p) => p.status !== "unpublished")
      .map((p) => ({
        id: p.slug,
        type: "essay",
        title: p.title,
        description: p.description,
        date: p.publishedAt,
        persona: p.persona ?? "builder",
        topics: p.tags,
        href: `/p/${p.slug}`,
        coverImage: p.coverImage,
      }));

    const noteEntries: ScribbleEntry[] = this.notes
      .filter((n) => n.status !== "unpublished")
      .map((n) => ({
        id: n.id,
        type: "note",
        title: n.title,
        description:
          n.content && n.content.length > 0
            ? n.content.join(" ")
            : n.description,
        date: n.date,
        persona: n.persona,
        topics: n.tags,
        href: `/n/${n.slug}`,
        coverImage: n.coverImage,
      }));

    const bookEntries: ScribbleEntry[] = this.books.map((b) => ({
      id: b.id,
      type: "book",
      title: b.title,
      description: b.description,
      date: b.date,
      persona: b.persona,
      topics: b.tags,
      href: "/library",
      author: b.author,
    }));

    return [...essays, ...noteEntries, ...bookEntries];
  }

  async getNowEntries(): Promise<NowEntry[]> {
    return [...this.nowEntries];
  }

  async saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    const index = this.nowEntries.findIndex((e) => e.id === entry.id);
    if (index >= 0) {
      this.nowEntries[index] = { ...entry };
    } else {
      this.nowEntries.unshift({ ...entry });
    }
    return entry;
  }

  async deleteNowEntry(id: string): Promise<boolean> {
    const index = this.nowEntries.findIndex((e) => e.id === id);
    if (index < 0) return false;
    this.nowEntries.splice(index, 1);
    return true;
  }

  async getMedia(): Promise<MediaItem[]> {
    return [...this.media];
  }

  async addMedia(item: MediaItem): Promise<MediaItem> {
    this.media.unshift({ ...item });
    return item;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const index = this.media.findIndex((m) => m.id === id);
    if (index < 0) return false;
    this.media.splice(index, 1);
    return true;
  }

  async getOrphanedMedia(): Promise<MediaItem[]> {
    const usedSrcs = new Set<string>();
    for (const post of this.posts) {
      if (post.coverImage) usedSrcs.add(post.coverImage);
    }
    for (const note of this.notes) {
      if (note.coverImage) usedSrcs.add(note.coverImage);
    }
    for (const book of this.books) {
      if (book.cover) usedSrcs.add(book.cover);
    }
    return this.media.filter((m) => !usedSrcs.has(m.src));
  }

  async deleteStorageAssets(srcs: string[]): Promise<number> {
    const toDelete = new Set(srcs);
    const before = this.storage.length;
    this.storage = this.storage.filter((s) => !toDelete.has(s));
    this.media = this.media.filter((m) => !toDelete.has(m.src));
    return before - this.storage.length;
  }

  async getUserRole(userId: string): Promise<AppRole | null> {
    const record = this.userRoles.find((r) => r.userId === userId);
    return record?.role ?? null;
  }

  async setUserRole(userId: string, role: AppRole): Promise<void> {
    const index = this.userRoles.findIndex((r) => r.userId === userId);
    if (index >= 0) {
      this.userRoles[index].role = role;
    } else {
      this.userRoles.push({ userId, role });
    }
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return [...this.userRoles];
  }

  async getFeaturedPosts(): Promise<string[]> {
    return [...this.featuredPosts];
  }

  async getFeaturedBooks(): Promise<string[]> {
    return [...this.featuredBooks];
  }

  async setFeaturedPosts(slugs: string[]): Promise<void> {
    this.featuredPosts = [...slugs];
  }

  async setFeaturedBooks(slugs: string[]): Promise<void> {
    this.featuredBooks = [...slugs];
  }

  async recordContribution(contribution: Contribution): Promise<Contribution> {
    const existing = this.contributions.find(
      (c) =>
        (contribution.paymentId && c.paymentId === contribution.paymentId) ||
        (contribution.orderId && c.orderId === contribution.orderId),
    );
    if (existing) return existing;

    this.contributions.unshift({ ...contribution });
    return contribution;
  }

  async getContribution(id: string): Promise<Contribution | null> {
    return (
      this.contributions.find(
        (c) => c.id === id || c.paymentId === id || c.orderId === id,
      ) ?? null
    );
  }

  async getContributions(): Promise<Contribution[]> {
    return [...this.contributions];
  }

  async getPasskeys(userId: string): Promise<PasskeyItem[]> {
    return [...this.passkeys];
  }

  async savePasskey(userId: string, item: PasskeyItem): Promise<PasskeyItem> {
    const index = this.passkeys.findIndex((p) => p.id === item.id);
    if (index >= 0) {
      this.passkeys[index] = { ...item };
    } else {
      this.passkeys.push({ ...item });
    }
    return item;
  }

  async deletePasskey(userId: string, id: string): Promise<boolean> {
    const index = this.passkeys.findIndex((p) => p.id === id);
    if (index < 0) return false;
    this.passkeys.splice(index, 1);
    return true;
  }

  async getSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<UserSession[]> {
    return this.sessions.map((s) => ({
      ...s,
      isCurrent: currentSessionId ? s.id === currentSessionId : s.isCurrent,
    }));
  }

  async recordSession(session: UserSession): Promise<UserSession> {
    const index = this.sessions.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      this.sessions[index] = { ...session };
    } else {
      this.sessions.push({ ...session });
    }
    return session;
  }

  async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const index = this.sessions.findIndex((s) => s.id === sessionId);
    if (index < 0) return false;
    this.sessions.splice(index, 1);
    return true;
  }

  async deleteAllSessions(userId: string): Promise<boolean> {
    this.sessions = [];
    return true;
  }

  async getConnectedProviders(userId: string): Promise<string[]> {
    return (
      this.connectedProviders[userId] ??
      this.connectedProviders["default"] ??
      []
    );
  }

  async setConnectedProviders(
    userId: string,
    providers: string[],
  ): Promise<void> {
    this.connectedProviders[userId] = [...providers];
  }

  async addSubscriber(
    email: string,
    source: string = "website",
  ): Promise<NewsletterSubscriber> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.subscribers.find((s) => s.email === normalizedEmail);
    if (existing) {
      existing.status = "active";
      return existing;
    }
    const item: NewsletterSubscriber = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      status: "active",
      source,
      createdAt: new Date().toISOString(),
    };
    this.subscribers.unshift(item);
    return item;
  }

  async getSubscribers(): Promise<NewsletterSubscriber[]> {
    return [...this.subscribers];
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const index = this.subscribers.findIndex((s) => s.id === id);
    if (index < 0) return false;
    this.subscribers.splice(index, 1);
    return true;
  }
}
