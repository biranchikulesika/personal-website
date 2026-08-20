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
import type { MockDatabase } from '@/lib/data/mock-db';
import type { ContentRepository } from './content.repository';

export class MockContentRepository implements ContentRepository {
  constructor(private db: MockDatabase) {}

  async getSiteContent(): Promise<SiteContent> {
    return this.db.site;
  }

  async getHomeContent(): Promise<HomeContent> {
    return {
      writing: this.db.writing,
      notes: this.db.notes,
      library: this.db.books,
    };
  }

  async getWriting(): Promise<SectionGroup<WritingItem>> {
    return this.db.writing;
  }

  async getLibrary(): Promise<SectionGroup<BookItem>> {
    return this.db.books;
  }

  async getPost(slug: string): Promise<BlogPost | null> {
    return this.db.posts.find((post) => post.slug === slug) ?? null;
  }

  async getPostSlugs(): Promise<string[]> {
    return this.db.posts.map((post) => post.slug);
  }

  async getAllPosts(): Promise<BlogPost[]> {
    return [...this.db.posts];
  }

  async savePost(post: BlogPost, persona: Persona = 'builder'): Promise<BlogPost> {
    const postWithStatus: BlogPost = {
      ...post,
      status: post.status || 'published',
    };
    const existingIndex = this.db.posts.findIndex((p) => p.slug === post.slug);
    if (existingIndex >= 0) {
      this.db.posts[existingIndex] = { ...postWithStatus };
    } else {
      this.db.posts.push({ ...postWithStatus });
    }

    // Keep writing items list in sync
    const writingIndex = this.db.writing.items.findIndex((w) => w.slug === post.slug);
    const writingEntry: WritingItem = {
      id: writingIndex >= 0 ? this.db.writing.items[writingIndex].id : `writing-${Date.now()}`,
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.plantedAt || new Date().toISOString().split('T')[0],
      persona,
      tags: post.tags,
      status: postWithStatus.status,
    };

    if (writingIndex >= 0) {
      this.db.writing.items[writingIndex] = writingEntry;
    } else {
      this.db.writing.items.unshift(writingEntry);
    }

    return postWithStatus;
  }

  async togglePostStatus(slug: string): Promise<BlogPost | null> {
    const post = this.db.posts.find((p) => p.slug === slug);
    if (!post) return null;
    const nextStatus = post.status === 'unpublished' ? 'published' : 'unpublished';
    post.status = nextStatus;

    const writing = this.db.writing.items.find((w) => w.slug === slug);
    if (writing) {
      writing.status = nextStatus;
    }
    return { ...post };
  }

  async deletePost(slug: string): Promise<boolean> {
    const postIndex = this.db.posts.findIndex((p) => p.slug === slug);
    if (postIndex >= 0) {
      this.db.posts.splice(postIndex, 1);
    }
    const writingIndex = this.db.writing.items.findIndex((w) => w.slug === slug);
    if (writingIndex >= 0) {
      this.db.writing.items.splice(writingIndex, 1);
    }
    return postIndex >= 0;
  }

  async getNote(slug: string): Promise<NoteItem | null> {
    return this.db.notes.items.find((item) => item.slug === slug) ?? null;
  }

  async getNoteSlugs(): Promise<string[]> {
    return this.db.notes.items.map((item) => item.slug);
  }

  async getAllNotes(): Promise<NoteItem[]> {
    return [...this.db.notes.items];
  }

  async saveNote(note: NoteItem): Promise<NoteItem> {
    const noteWithStatus: NoteItem = {
      ...note,
      status: note.status || 'published',
    };
    const existingIndex = this.db.notes.items.findIndex((n) => n.slug === note.slug);
    if (existingIndex >= 0) {
      this.db.notes.items[existingIndex] = { ...noteWithStatus };
    } else {
      this.db.notes.items.unshift({ ...noteWithStatus });
    }
    return noteWithStatus;
  }

  async toggleNoteStatus(slug: string): Promise<NoteItem | null> {
    const note = this.db.notes.items.find((n) => n.slug === slug);
    if (!note) return null;
    note.status = note.status === 'unpublished' ? 'published' : 'unpublished';
    return { ...note };
  }

  async deleteNote(slug: string): Promise<boolean> {
    const index = this.db.notes.items.findIndex((n) => n.slug === slug);
    if (index >= 0) {
      this.db.notes.items.splice(index, 1);
      return true;
    }
    return false;
  }

  async getAllBooks(): Promise<BookItem[]> {
    return [...this.db.books.items];
  }

  async saveBook(book: BookItem): Promise<BookItem> {
    const existingIndex = this.db.books.items.findIndex((b) => b.slug === book.slug);
    if (existingIndex >= 0) {
      this.db.books.items[existingIndex] = { ...book };
    } else {
      this.db.books.items.unshift({ ...book });
    }
    return book;
  }

  async deleteBook(slug: string): Promise<boolean> {
    const index = this.db.books.items.findIndex((b) => b.slug === slug);
    if (index >= 0) {
      this.db.books.items.splice(index, 1);
      return true;
    }
    return false;
  }

  async getPage(slug: string): Promise<PageContent | null> {
    return this.db.pages.find((page) => page.slug === slug) ?? null;
  }

  async getNowEntries(): Promise<NowEntry[]> {
    return [...this.db.now];
  }

  async saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    const existingIndex = this.db.now.findIndex((e) => e.id === entry.id);
    const saved: NowEntry = {
      ...entry,
      content: entry.content.trim(),
    };
    if (existingIndex >= 0) {
      this.db.now[existingIndex] = { ...saved };
    } else {
      this.db.now.push({ ...saved });
    }
    this.db.now.sort((a, b) => b.date.localeCompare(a.date));
    return saved;
  }

  async deleteNowEntry(id: string): Promise<boolean> {
    const index = this.db.now.findIndex((e) => e.id === id);
    if (index >= 0) {
      this.db.now.splice(index, 1);
      return true;
    }
    return false;
  }

  async getScribbleEntries(): Promise<ScribbleEntry[]> {
    const essays: ScribbleEntry[] = this.db.writing.items.map((item) => ({
      id: item.id,
      type: 'essay',
      title: item.title,
      description: item.description,
      date: item.date,
      persona: item.persona,
      topics: item.tags,
      href: `/p/${item.slug}`,
    }));

    const notes: ScribbleEntry[] = this.db.notes.items.map((item) => ({
      id: item.id,
      type: 'note',
      title: item.title,
      description: item.description,
      date: item.date,
      persona: item.persona,
      topics: item.tags,
      href: `/n/${item.slug}`,
    }));

    const books: ScribbleEntry[] = this.db.books.items.map((item) => ({
      id: item.id,
      type: 'book',
      title: item.title,
      description: item.description,
      date: item.date,
      persona: item.persona,
      topics: item.tags,
      href: this.db.books.href,
      author: item.author,
    }));

    return [...essays, ...notes, ...books];
  }

  async getMedia(): Promise<MediaItem[]> {
    return [...this.db.media];
  }

  async addMedia(item: MediaItem): Promise<MediaItem> {
    this.db.media.unshift({ ...item });
    return item;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const index = this.db.media.findIndex((m) => m.id === id);
    if (index >= 0) {
      this.db.media.splice(index, 1);
      return true;
    }
    return false;
  }

  async getOrphanedMedia(): Promise<MediaItem[]> {
    const referenced = new Set<string>();

    // Registered media library — the author knows these assets.
    for (const item of this.db.media) {
      referenced.add(item.src);
    }

    // Structured image references.
    if (this.db.site.hero.image.src) {
      referenced.add(this.db.site.hero.image.src);
    }
    if (this.db.admin.avatarUrl) {
      referenced.add(this.db.admin.avatarUrl);
    }
    for (const item of this.db.writing.items) {
      if (item.coverImage) referenced.add(item.coverImage);
    }
    for (const item of this.db.notes.items) {
      if (item.coverImage) referenced.add(item.coverImage);
    }
    for (const post of this.db.posts) {
      if (post.coverImage) referenced.add(post.coverImage);
      for (const section of post.sections) {
        if (section.figure?.src) referenced.add(section.figure.src);
      }
    }

    // Scan free text for inline / markdown image references.
    const textBlob: string[] = [];
    for (const item of this.db.writing.items) {
      textBlob.push(item.title, item.subtitle ?? '', item.description);
    }
    for (const item of this.db.notes.items) {
      textBlob.push(item.title, item.description, ...item.content);
    }
    for (const item of this.db.books.items) {
      textBlob.push(item.title, item.author, item.description);
    }
    for (const post of this.db.posts) {
      textBlob.push(post.title, post.subtitle ?? '', post.description);
      textBlob.push(...post.intro);
      for (const section of post.sections) {
        textBlob.push(section.heading, ...section.paragraphs);
        if (section.footnotes) textBlob.push(...section.footnotes);
      }
    }
    for (const page of this.db.pages) {
      textBlob.push(page.title, page.description, page.content);
    }
    const body = textBlob.join(' ');

    return this.db.storage
      .filter((src) => !referenced.has(src) && !body.includes(src))
      .map((src) => ({
        id: `bucket-${src}`,
        name: src.split('/').pop() ?? src,
        src,
        alt: '',
        size: '—',
        uploadedAt: '',
        tag: 'atmosphere' as const,
      }));
  }

  async deleteStorageAssets(srcs: string[]): Promise<number> {
    const toDelete = new Set(srcs);
    const before = this.db.storage.length;
    this.db.storage = this.db.storage.filter((src) => !toDelete.has(src));
    return before - this.db.storage.length;
  }

  async getAdminProfile(): Promise<AdminProfile> {
    return { ...this.db.admin };
  }

  async updateAdminProfile(profile: Partial<AdminProfile>): Promise<AdminProfile> {
    this.db.admin = { ...this.db.admin, ...profile };
    return this.db.admin;
  }
}