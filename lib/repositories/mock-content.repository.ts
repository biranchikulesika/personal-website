import type { MockDatabase } from "@/lib/data/mock-db";
import type {
  AppRole,
  UserRole,
  BlogPost,
  BookItem,
  HomeContent,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
  ScribbleEntry,
  SectionGroup,
  WritingItem,
} from "@/lib/types";
import type { ContentRepository } from "./content.repository";

/**
 * Mock in-memory repository for tests. Content collections start empty —
 * tests create their own data via save/update/delete methods.
 */
export class MockContentRepository implements ContentRepository {
  private posts: BlogPost[] = [];
  private notes: NoteItem[] = [];
  private books: BookItem[] = [];
  private now: NowEntry[] = [];
  private featuredPosts: string[] = [];
  private featuredBooks: string[] = [];

  constructor(private db: MockDatabase) {}

  // ── Site Content (hardcoded) ────────────────────────────────────────────

  async getHomeContent(): Promise<HomeContent> {
    return {
      writing: { title: "Writing", href: "/scribble", subheader: "", items: [] },
      notes: { title: "Notes", href: "/scribble", subheader: "", items: [] },
      library: { title: "Library", href: "/library", subheader: "", items: [] },
    };
  }

  async getWriting(): Promise<SectionGroup<WritingItem>> {
    return { title: "Writing", href: "/scribble", subheader: "", items: [] };
  }

  async getLibrary(): Promise<SectionGroup<BookItem>> {
    return { title: "Library", href: "/library", subheader: "", items: [] };
  }

  // ── Posts ───────────────────────────────────────────────────────────────

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

  async savePost(post: BlogPost, _persona?: Persona): Promise<BlogPost> {
    const saved = { ...post, status: post.status || ("published" as const) };
    const idx = this.posts.findIndex((p) => p.slug === post.slug);
    if (idx >= 0) {
      this.posts[idx] = saved;
    } else {
      this.posts.push(saved);
    }
    return saved;
  }

  async togglePostStatus(slug: string): Promise<BlogPost | null> {
    const post = this.posts.find((p) => p.slug === slug);
    if (!post) return null;
    post.status = post.status === "unpublished" ? "published" : "unpublished";
    return { ...post };
  }

  async deletePost(slug: string): Promise<boolean> {
    const idx = this.posts.findIndex((p) => p.slug === slug);
    if (idx >= 0) {
      this.posts.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ── Notes ───────────────────────────────────────────────────────────────

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
    const saved = { ...note, status: note.status || ("published" as const) };
    const idx = this.notes.findIndex((n) => n.slug === note.slug);
    if (idx >= 0) {
      this.notes[idx] = saved;
    } else {
      this.notes.push(saved);
    }
    return saved;
  }

  async toggleNoteStatus(slug: string): Promise<NoteItem | null> {
    const note = this.notes.find((n) => n.slug === slug);
    if (!note) return null;
    note.status = note.status === "unpublished" ? "published" : "unpublished";
    return { ...note };
  }

  async deleteNote(slug: string): Promise<boolean> {
    const idx = this.notes.findIndex((n) => n.slug === slug);
    if (idx >= 0) {
      this.notes.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ── Books ───────────────────────────────────────────────────────────────

  async getAllBooks(): Promise<BookItem[]> {
    return [...this.books];
  }

  async saveBook(book: BookItem): Promise<BookItem> {
    const idx = this.books.findIndex((b) => b.slug === book.slug);
    if (idx >= 0) {
      this.books[idx] = { ...book };
    } else {
      this.books.push({ ...book });
    }
    return book;
  }

  async deleteBook(slug: string): Promise<boolean> {
    const idx = this.books.findIndex((b) => b.slug === slug);
    if (idx >= 0) {
      this.books.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ── Now Entries ─────────────────────────────────────────────────────────

  async getNowEntries(): Promise<NowEntry[]> {
    return [...this.now];
  }

  async saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    const saved = { ...entry, content: entry.content.trim() };
    const idx = this.now.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      this.now[idx] = saved;
    } else {
      this.now.push(saved);
    }
    this.now.sort((a, b) => b.date.localeCompare(a.date));
    return saved;
  }

  async deleteNowEntry(id: string): Promise<boolean> {
    const idx = this.now.findIndex((e) => e.id === id);
    if (idx >= 0) {
      this.now.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ── Scribble ────────────────────────────────────────────────────────────

  async getScribbleEntries(): Promise<ScribbleEntry[]> {
    const essays: ScribbleEntry[] = this.posts.map((p) => ({
      id: p.slug,
      type: "essay" as const,
      title: p.title,
      description: p.description,
      date: p.publishedAt,
      persona: p.persona ?? "builder",
      topics: p.tags,
      href: `/p/${p.slug}`,
      coverImage: p.coverImage,
    }));

    const noteEntries: ScribbleEntry[] = this.notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      description: n.description,
      date: n.date,
      persona: n.persona,
      topics: n.tags,
      href: `/n/${n.slug}`,
      coverImage: n.coverImage,
    }));

    const bookEntries: ScribbleEntry[] = this.books.map((b) => ({
      id: b.id,
      type: "book" as const,
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

  // ── Media ───────────────────────────────────────────────────────────────

  async getMedia(): Promise<MediaItem[]> {
    return [...this.db.media];
  }

  async addMedia(item: MediaItem): Promise<MediaItem> {
    this.db.media.unshift({ ...item });
    return item;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const idx = this.db.media.findIndex((m) => m.id === id);
    if (idx >= 0) {
      this.db.media.splice(idx, 1);
      return true;
    }
    return false;
  }

  async getOrphanedMedia(): Promise<MediaItem[]> {
    const referenced = new Set<string>();
    for (const item of this.db.media) {
      referenced.add(item.src);
    }
    referenced.add("/biranchi.jpeg");

    // Also scan posts, notes for cover images
    for (const post of this.posts) {
      if (post.coverImage) referenced.add(post.coverImage);
    }
    for (const note of this.notes) {
      if (note.coverImage) referenced.add(note.coverImage);
    }

    return this.db.storage
      .filter((src) => !referenced.has(src))
      .map((src) => ({
        id: `bucket-${src}`,
        name: src.split("/").pop() ?? src,
        src,
        alt: "",
        size: "—",
        uploadedAt: "",
        tag: "atmosphere" as const,
      }));
  }

  async deleteStorageAssets(srcs: string[]): Promise<number> {
    const toDelete = new Set(srcs);
    const before = this.db.storage.length;
    this.db.storage = this.db.storage.filter((src) => !toDelete.has(src));
    return before - this.db.storage.length;
  }

  // ── Featured Items ──────────────────────────────────────────────────────

  async getFeaturedPosts(): Promise<string[]> {
    return [...this.featuredPosts];
  }

  async getFeaturedBooks(): Promise<string[]> {
    return [...this.featuredBooks];
  }

  async setFeaturedPosts(slugs: string[]): Promise<void> {
    this.featuredPosts = slugs.slice(0, 4);
  }

  async setFeaturedBooks(slugs: string[]): Promise<void> {
    this.featuredBooks = slugs.slice(0, 4);
  }

  // ── User Roles ──────────────────────────────────────────────────────────

  async getUserRole(userId: string): Promise<AppRole | null> {
    const entry = this.db.userRoles.find((r) => r.userId === userId);
    return entry?.role ?? null;
  }

  async setUserRole(userId: string, role: AppRole): Promise<void> {
    const idx = this.db.userRoles.findIndex((r) => r.userId === userId);
    if (idx >= 0) {
      this.db.userRoles[idx].role = role;
    } else {
      this.db.userRoles.push({ userId, role });
    }
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return [...this.db.userRoles];
  }
}
