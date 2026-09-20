import { eq, desc, asc, and, sql, or, ne, inArray } from "drizzle-orm";
import { getDbClient } from "@/lib/db/client";
import {
  posts,
  notes,
  books,
  nowEntries,
  media,
  featuredItems,
  subscribers,
  userRoles,
  contributions,
  storageFiles,
  type PostSelect,
  type NoteSelect,
  type BookSelect,
  type NowEntrySelect,
  type MediaSelect,
} from "@/lib/db/schema";
import type {
  AppRole,
  BlogPost,
  BookCard,
  BookItem,
  Contribution,
  HomeContent,
  MediaItem,
  NewsletterSubscriber,
  NoteItem,
  NowEntry,
  PasskeyItem,
  PasskeyCredentialRecord,
  Persona,
  PostSection,
  ScribbleEntry,
  SectionGroup,
  UserRole,
  UserSession,
  WritingItem,
} from "@/lib/types";
import type { ContentRepository } from "./content.repository";
import { getMediaStorage } from "@/lib/storage";
import { nowSlug } from "@/lib/utils";

// ── Row Mappers ────────────────────────────────────────────────────────────

function postRowToDomain(row: PostSelect): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    description: row.description,
    persona: (row.persona as Persona) ?? undefined,
    tags: row.tags ?? [],
    publishedAt: row.publishedAt ?? "",
    lastEditedAt: row.lastEditedAt ?? "",
    targetAudience: row.assumedAudience ?? "",
    intro: (row.intro as string[]) ?? [],
    sections: (row.sections as unknown as PostSection[]) ?? [],
    books: (row.books as unknown as BookCard[]) ?? [],
    coverImage: row.coverImage ?? undefined,
    status: row.status,
  };
}

function noteRowToDomain(row: NoteSelect): NoteItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    description: row.description,
    content: (row.content as string[]) ?? [],
    date: row.date ?? "",
    persona: (row.persona as Persona) ?? "thinker",
    tags: row.tags ?? [],
    coverImage: row.coverImage ?? undefined,
    status: row.status,
  };
}

function bookRowToDomain(row: BookSelect): BookItem {
  const isPublished = row.isPublished !== false;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    description: row.description,
    date: row.date ?? "",
    persona: (row.persona as Persona) ?? "thinker",
    tags: row.tags ?? [],
    cover: row.cover ?? undefined,
    link: row.link ?? undefined,
    isPublished,
    status: isPublished ? "published" : "unpublished",
  };
}

function nowRowToDomain(row: NowEntrySelect): NowEntry {
  return {
    id: row.id,
    title: row.title,
    date: row.date || row.createdAt.toISOString().slice(0, 7),
    slug: row.slug,
    content: row.content,
    location: row.location || undefined,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastEditedAt: row.lastEditedAt ? row.lastEditedAt.toISOString() : undefined,
  };
}

function mediaRowToDomain(row: MediaSelect): MediaItem {
  const rawTags: string[] = Array.isArray(row.tags) && row.tags.length > 0
    ? row.tags
    : row.tag
      ? [row.tag]
      : [];

  const tags = rawTags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && t !== "atmosphere" && t !== "profile");

  return {
    id: row.id,
    name: row.name,
    src: row.src,
    alt: row.alt,
    size: row.size,
    dimensions: row.dimensions ?? undefined,
    uploadedAt: row.uploadedAt || row.createdAt.toISOString().split("T")[0] || "",
    tags,
    tag: tags[0] || undefined,
  };
}

/**
 * Production Drizzle ORM implementation of ContentRepository.
 * Interacts directly with PostgreSQL via Drizzle query builders.
 * Replaces provider-specific APIs with portable, typed SQL operations.
 */
export class DrizzleContentRepository implements ContentRepository {
  private get db() {
    return getDbClient();
  }

  // ── Home Content ─────────────────────────────────────────────────────────

  async getHomeContent(): Promise<HomeContent> {
    const [writing, allNotes, library] = await Promise.all([
      this.getWriting(),
      this.getAllNotes(),
      this.getLibrary(),
    ]);

    const publishedNotes = allNotes.filter((n) => n.status !== "unpublished");

    return {
      writing,
      notes: {
        title: "Notes",
        href: "/scribble",
        subheader:
          "Things I want to share, stories, opinions, observations, and thoughts.",
        items: publishedNotes,
      },
      library,
    };
  }

  async getWriting(): Promise<SectionGroup<WritingItem>> {
    const rows = await this.db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt));

    const items: WritingItem[] = rows.map((row) => ({
      id: row.slug,
      slug: row.slug,
      title: row.title,
      description: row.description,
      date: row.publishedAt ?? "",
      persona: (row.persona as Persona) ?? "builder",
      tags: row.tags ?? [],
      status: row.status,
    }));

    return {
      title: "Writing",
      href: "/scribble",
      subheader: "Thoughts and ideas I want to explore and explain",
      items,
    };
  }

  async getLibrary(): Promise<SectionGroup<BookItem>> {
    const rows = await this.db
      .select()
      .from(books)
      .where(eq(books.isPublished, true))
      .orderBy(desc(books.createdAt));

    return {
      title: "Library",
      href: "/library",
      subheader: "Books I've read, loved, and recommend for others to read.",
      items: rows.map(bookRowToDomain),
    };
  }

  // ── Posts ────────────────────────────────────────────────────────────────

  async getPost(slug: string): Promise<BlogPost | null> {
    const rows = await this.db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    return postRowToDomain(rows[0]);
  }

  async getPostSlugs(): Promise<string[]> {
    const rows = await this.db
      .select({ slug: posts.slug })
      .from(posts)
      .where(eq(posts.status, "published"));

    return rows.map((r) => r.slug);
  }

  async getAllPosts(): Promise<BlogPost[]> {
    const rows = await this.db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));

    return rows.map(postRowToDomain);
  }

  async savePost(
    post: BlogPost,
    persona: Persona = "builder",
  ): Promise<BlogPost> {
    const status = post.status || "published";

    // Cross-collection slug collision check
    const existingNote = await this.db
      .select({ slug: notes.slug })
      .from(notes)
      .where(eq(notes.slug, post.slug))
      .limit(1);

    if (existingNote.length > 0) {
      throw new Error(`Slug "${post.slug}" already exists. Choose a unique slug.`);
    }

    const existingBook = await this.db
      .select({ slug: books.slug })
      .from(books)
      .where(eq(books.slug, post.slug))
      .limit(1);

    if (existingBook.length > 0) {
      throw new Error(`Slug "${post.slug}" already exists. Choose a unique slug.`);
    }

    const values = {
      slug: post.slug,
      title: post.title,
      subtitle: post.subtitle ?? null,
      description: post.description,
      persona: persona,
      tags: post.tags,
      publishedAt: post.publishedAt || null,
      lastEditedAt: post.lastEditedAt || null,
      assumedAudience: post.targetAudience || "",
      intro: post.intro,
      sections: post.sections,
      books: post.books,
      coverImage: post.coverImage ?? null,
      status: status as "published" | "unpublished",
      updatedAt: new Date(),
    };

    await this.db
      .insert(posts)
      .values(values)
      .onConflictDoUpdate({
        target: posts.slug,
        set: values,
      });

    return { ...post, status };
  }

  async togglePostStatus(slug: string): Promise<BlogPost | null> {
    const post = await this.getPost(slug);
    if (!post) return null;

    const nextStatus =
      post.status === "unpublished" ? "published" : "unpublished";

    await this.db
      .update(posts)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(posts.slug, slug));

    return { ...post, status: nextStatus };
  }

  async deletePost(slug: string): Promise<boolean> {
    const result = await this.db.delete(posts).where(eq(posts.slug, slug));
    return (result.count ?? 0) > 0;
  }

  // ── Notes ────────────────────────────────────────────────────────────────

  async getNote(slug: string): Promise<NoteItem | null> {
    const rows = await this.db
      .select()
      .from(notes)
      .where(eq(notes.slug, slug))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    return noteRowToDomain(rows[0]);
  }

  async getNoteSlugs(): Promise<string[]> {
    const rows = await this.db
      .select({ slug: notes.slug })
      .from(notes)
      .where(eq(notes.status, "published"));

    return rows.map((r) => r.slug);
  }

  async getAllNotes(): Promise<NoteItem[]> {
    const rows = await this.db
      .select()
      .from(notes)
      .orderBy(desc(notes.date), desc(notes.createdAt));

    return rows.map(noteRowToDomain);
  }

  async saveNote(note: NoteItem): Promise<NoteItem> {
    const status = note.status || "published";

    // Cross-collection slug collision check
    const existingPost = await this.db
      .select({ slug: posts.slug })
      .from(posts)
      .where(eq(posts.slug, note.slug))
      .limit(1);

    if (existingPost.length > 0) {
      throw new Error(`Slug "${note.slug}" already exists. Choose a unique slug.`);
    }

    const existingBook = await this.db
      .select({ slug: books.slug })
      .from(books)
      .where(eq(books.slug, note.slug))
      .limit(1);

    if (existingBook.length > 0) {
      throw new Error(`Slug "${note.slug}" already exists. Choose a unique slug.`);
    }

    const values = {
      id: note.id,
      slug: note.slug,
      title: note.title,
      subtitle: note.subtitle ?? null,
      description: note.description,
      content: note.content,
      date: note.date || null,
      persona: note.persona,
      tags: note.tags,
      coverImage: note.coverImage ?? null,
      status: status as "published" | "unpublished",
      updatedAt: new Date(),
    };

    await this.db
      .insert(notes)
      .values(values)
      .onConflictDoUpdate({
        target: notes.slug,
        set: values,
      });

    return { ...note, status };
  }

  async toggleNoteStatus(slug: string): Promise<NoteItem | null> {
    const note = await this.getNote(slug);
    if (!note) return null;

    const nextStatus =
      note.status === "unpublished" ? "published" : "unpublished";

    await this.db
      .update(notes)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(notes.slug, slug));

    return { ...note, status: nextStatus };
  }

  async deleteNote(slug: string): Promise<boolean> {
    const result = await this.db.delete(notes).where(eq(notes.slug, slug));
    return (result.count ?? 0) > 0;
  }

  // ── Books ────────────────────────────────────────────────────────────────

  async getAllBooks(): Promise<BookItem[]> {
    const rows = await this.db
      .select()
      .from(books)
      .orderBy(desc(books.createdAt));

    return rows.map(bookRowToDomain);
  }

  async saveBook(book: BookItem): Promise<BookItem> {
    // Cross-collection slug collision check
    const existingPost = await this.db
      .select({ slug: posts.slug })
      .from(posts)
      .where(eq(posts.slug, book.slug))
      .limit(1);

    if (existingPost.length > 0) {
      throw new Error(`Slug "${book.slug}" already exists. Choose a unique slug.`);
    }

    const existingNote = await this.db
      .select({ slug: notes.slug })
      .from(notes)
      .where(eq(notes.slug, book.slug))
      .limit(1);

    if (existingNote.length > 0) {
      throw new Error(`Slug "${book.slug}" already exists. Choose a unique slug.`);
    }

    const isPublished =
      book.isPublished !== false && book.status !== "unpublished";

    const values = {
      id: book.id,
      slug: book.slug,
      title: book.title,
      author: book.author,
      description: book.description,
      date: book.date || null,
      persona: book.persona,
      tags: book.tags,
      cover: book.cover ?? null,
      link: book.link ?? null,
      isPublished,
      updatedAt: new Date(),
    };

    await this.db
      .insert(books)
      .values(values)
      .onConflictDoUpdate({
        target: books.id,
        set: values,
      });

    return {
      ...book,
      isPublished,
      status: isPublished ? "published" : "unpublished",
    };
  }

  async deleteBook(slug: string): Promise<boolean> {
    const result = await this.db.delete(books).where(eq(books.slug, slug));
    return (result.count ?? 0) > 0;
  }

  async toggleBookStatus(slug: string): Promise<BookItem | null> {
    const rows = await this.db
      .select()
      .from(books)
      .where(eq(books.slug, slug))
      .limit(1);

    if (!rows || rows.length === 0) return null;

    const currentBook = bookRowToDomain(rows[0]);
    const nextPublished = !currentBook.isPublished;

    await this.db
      .update(books)
      .set({
        isPublished: nextPublished,
        updatedAt: new Date(),
      })
      .where(eq(books.slug, slug));

    return {
      ...currentBook,
      isPublished: nextPublished,
      status: nextPublished ? "published" : "unpublished",
    };
  }

  // ── Scribble ─────────────────────────────────────────────────────────────

  async getScribbleEntries(): Promise<ScribbleEntry[]> {
    const [postsList, notesList] = await Promise.all([
      this.getAllPosts(),
      this.getAllNotes(),
    ]);

    const essays: ScribbleEntry[] = postsList
      .filter((post) => post.status !== "unpublished")
      .map((post) => ({
        id: post.slug,
        type: "essay" as const,
        title: post.title,
        description: post.description,
        date: post.publishedAt,
        persona: post.persona ?? "builder",
        topics: post.tags,
        href: `/p/${post.slug}`,
        coverImage: post.coverImage,
      }));

    const noteEntries: ScribbleEntry[] = notesList
      .filter((note) => note.status !== "unpublished")
      .map((note) => ({
        id: note.id,
        type: "note" as const,
        title: note.title,
        description:
          note.content && note.content.length > 0
            ? note.content.join(" ")
            : note.description,
        date: note.date,
        persona: note.persona,
        topics: note.tags,
        href: `/n/${note.slug}`,
        coverImage: note.coverImage,
      }));

    return [...essays, ...noteEntries];
  }

  // ── Now ──────────────────────────────────────────────────────────────────

  async getNowEntries(): Promise<NowEntry[]> {
    const rows = await this.db
      .select()
      .from(nowEntries)
      .orderBy(desc(nowEntries.createdAt));

    return rows.map(nowRowToDomain);
  }

  async saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    const id = entry.id || `now-${crypto.randomUUID()}`;
    const baseSlug = nowSlug(entry.slug, entry.title);
    let slug = baseSlug || `now-${crypto.randomUUID()}`;
    let counter = 2;

    while (await this.isNowSlugTaken(slug, id)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const values = {
      id,
      slug,
      title: entry.title,
      date: entry.date || new Date().toISOString().slice(0, 7),
      content: entry.content.trim(),
      location: entry.location || "",
      status: (entry.status || "published") as "published" | "unpublished",
      lastEditedAt: entry.lastEditedAt ? new Date(entry.lastEditedAt) : null,
      updatedAt: new Date(),
    };

    await this.db
      .insert(nowEntries)
      .values(values)
      .onConflictDoUpdate({
        target: nowEntries.id,
        set: values,
      });

    return {
      ...entry,
      id,
      slug,
      content: entry.content.trim(),
      status: values.status,
      date: values.date,
    };
  }

  private async isNowSlugTaken(slug: string, excludeId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: nowEntries.id })
      .from(nowEntries)
      .where(and(eq(nowEntries.slug, slug), ne(nowEntries.id, excludeId)))
      .limit(1);

    return rows.length > 0;
  }

  async deleteNowEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(nowEntries).where(eq(nowEntries.id, id));
    return (result.count ?? 0) > 0;
  }

  // ── Media ────────────────────────────────────────────────────────────────

  async getMedia(): Promise<MediaItem[]> {
    const rows = await this.db
      .select()
      .from(media)
      .orderBy(desc(media.createdAt));

    return rows.map(mediaRowToDomain);
  }

  async addMedia(item: MediaItem): Promise<MediaItem> {
    let finalSrc = item.src;

    // If item.src is a Base64 data URL, upload through MediaStorage abstraction
    if (item.src.startsWith("data:")) {
      try {
        const matches = item.src.match(
          /^data:(image\/([a-zA-Z0-9+.-]+));base64,(.+)$/,
        );
        if (matches) {
          const contentType = matches[1];
          const ext = matches[2] === "jpeg" ? "jpg" : matches[2];
          const base64Data = matches[3];
          const cleanItemName = item.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_");
          const fileName = item.name.startsWith("res-")
            ? `${cleanItemName}.${ext}`
            : `${Date.now()}-${cleanItemName}.${ext}`;

          const buffer = Buffer.from(base64Data, "base64");
          const storage = getMediaStorage();
          const uploadResult = await storage.upload({
            buffer,
            fileName,
            contentType,
          });

          finalSrc = uploadResult.url;
        }
      } catch {
        // Fallback to storing source as is
      }
    }

    const tags = (
      Array.isArray(item.tags) ? item.tags : item.tag ? [item.tag] : []
    )
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && t !== "atmosphere" && t !== "profile");

    const values = {
      id: item.id,
      name: item.name,
      src: finalSrc,
      alt: item.alt,
      size: item.size,
      dimensions: item.dimensions ?? null,
      uploadedAt: item.uploadedAt
        ? item.uploadedAt.includes("T")
          ? item.uploadedAt.split("T")[0]
          : item.uploadedAt
        : null,
      tags,
      tag: tags[0] || "",
      updatedAt: new Date(),
    };

    await this.db
      .insert(media)
      .values(values)
      .onConflictDoUpdate({
        target: media.id,
        set: values,
      });

    return { ...item, src: finalSrc };
  }

  async deleteMedia(id: string): Promise<boolean> {
    const result = await this.db.delete(media).where(eq(media.id, id));
    return (result.count ?? 0) > 0;
  }

  async getOrphanedMedia(): Promise<MediaItem[]> {
    return [];
  }

  async deleteStorageAssets(srcs: string[]): Promise<number> {
    if (srcs.length === 0) return 0;

    // Delete tracked storage files from table
    const result = await this.db
      .delete(storageFiles)
      .where(inArray(storageFiles.path, srcs));

    // Also call storage provider deletion
    try {
      await getMediaStorage().delete(srcs);
    } catch {
      // Ignored for non-cloud assets
    }

    return result.count ?? 0;
  }

  // ── User Roles ───────────────────────────────────────────────────────────

  async getUserRole(userId: string): Promise<AppRole | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId,
      );
    if (!isUuid) return null;

    try {
      const rows = await this.db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userId))
        .limit(1);

      if (!rows || rows.length === 0) return null;
      return rows[0].role as AppRole;
    } catch {
      return null;
    }
  }

  async setUserRole(userId: string, role: AppRole): Promise<void> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId,
      );
    if (!isUuid) {
      throw new Error(`Invalid UUID format for userId: "${userId}"`);
    }

    await this.db
      .insert(userRoles)
      .values({
        userId,
        role,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userRoles.userId,
        set: {
          role,
          updatedAt: new Date(),
        },
      });
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    const rows = await this.db.select().from(userRoles);
    return rows.map((r) => ({
      userId: r.userId,
      role: r.role as AppRole,
    }));
  }

  // ── Featured Items ───────────────────────────────────────────────────────

  async getFeaturedPosts(): Promise<string[]> {
    const rows = await this.db
      .select({ itemId: featuredItems.itemId })
      .from(featuredItems)
      .where(eq(featuredItems.itemType, "post"))
      .orderBy(asc(featuredItems.position));

    return rows.map((r) => r.itemId);
  }

  async getFeaturedBooks(): Promise<string[]> {
    const rows = await this.db
      .select({ itemId: featuredItems.itemId })
      .from(featuredItems)
      .where(eq(featuredItems.itemType, "book"))
      .orderBy(asc(featuredItems.position));

    return rows.map((r) => r.itemId);
  }

  async setFeaturedPosts(slugs: string[]): Promise<void> {
    await this.db
      .delete(featuredItems)
      .where(eq(featuredItems.itemType, "post"));

    if (slugs.length > 0) {
      const rows = slugs.map((slug, i) => ({
        itemType: "post",
        itemId: slug,
        position: i + 1,
      }));
      await this.db.insert(featuredItems).values(rows);
    }
  }

  async setFeaturedBooks(slugs: string[]): Promise<void> {
    await this.db
      .delete(featuredItems)
      .where(eq(featuredItems.itemType, "book"));

    if (slugs.length > 0) {
      const rows = slugs.map((slug, i) => ({
        itemType: "book",
        itemId: slug,
        position: i + 1,
      }));
      await this.db.insert(featuredItems).values(rows);
    }
  }

  // ── Contributions & Patronage ─────────────────────────────────────────────

  async recordContribution(contribution: Contribution): Promise<Contribution> {
    const values = {
      id: contribution.id,
      orderId: contribution.orderId ?? null,
      paymentId: contribution.paymentId ?? null,
      amount: String(contribution.amount),
      currency: contribution.currency,
      status: contribution.status,
      name: contribution.name,
      email: contribution.email ?? null,
      note: contribution.note ?? null,
      createdAt: new Date(contribution.createdAt),
      source: contribution.source,
    };

    await this.db
      .insert(contributions)
      .values(values)
      .onConflictDoUpdate({
        target: contributions.id,
        set: values,
      });

    return contribution;
  }

  async getContribution(id: string): Promise<Contribution | null> {
    const rows = await this.db
      .select()
      .from(contributions)
      .where(
        or(
          eq(contributions.id, id),
          eq(contributions.paymentId, id),
          eq(contributions.orderId, id),
        ),
      )
      .limit(1);

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      orderId: r.orderId ?? undefined,
      paymentId: r.paymentId ?? undefined,
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status as Contribution["status"],
      name: r.name,
      email: r.email ?? undefined,
      note: r.note ?? undefined,
      createdAt: r.createdAt.toISOString(),
      source: (r.source as Contribution["source"]) ?? "razorpay",
    };
  }

  async getContributions(): Promise<Contribution[]> {
    const rows = await this.db
      .select()
      .from(contributions)
      .orderBy(desc(contributions.createdAt));

    return rows.map((r) => ({
      id: r.id,
      orderId: r.orderId ?? undefined,
      paymentId: r.paymentId ?? undefined,
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status as Contribution["status"],
      name: r.name,
      email: r.email ?? undefined,
      note: r.note ?? undefined,
      createdAt: r.createdAt.toISOString(),
      source: (r.source as Contribution["source"]) ?? "razorpay",
    }));
  }

  // ── Passkeys & Auth ───────────────────────────────────────────────────────

  async getPasskeys(_userId: string): Promise<PasskeyItem[]> {
    return [];
  }

  async savePasskey(_userId: string, passkey: PasskeyItem): Promise<PasskeyItem> {
    return passkey;
  }

  async deletePasskey(_userId: string, _passkeyId: string): Promise<boolean> {
    return true;
  }

  async findPasskeyCredential(_credentialId: string): Promise<PasskeyCredentialRecord | null> {
    return null;
  }

  async getAllAdminPasskeys(): Promise<PasskeyItem[]> {
    return [];
  }

  // ── Active Sessions ───────────────────────────────────────────────────────

  async getSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<UserSession[]> {
    return [
      {
        id: currentSessionId || "session-primary",
        userId,
        device: "Current Device",
        location: "Active Connection",
        startedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
      },
    ];
  }

  async recordSession(session: UserSession): Promise<UserSession> {
    return session;
  }

  async deleteSession(_userId: string, _sessionId: string): Promise<boolean> {
    return true;
  }

  async deleteAllSessions(_userId: string): Promise<boolean> {
    return true;
  }

  // ── Connected Accounts ────────────────────────────────────────────────────

  async getConnectedProviders(_userId: string): Promise<string[]> {
    return ["google"];
  }

  async setConnectedProviders(_userId: string, _providers: string[]): Promise<void> {}

  // ── Newsletter Subscribers ────────────────────────────────────────────────

  async addSubscriber(
    email: string,
    source: string = "website",
  ): Promise<NewsletterSubscriber> {
    const normalizedEmail = email.trim().toLowerCase();
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const values = {
      id,
      email: normalizedEmail,
      status: "active",
      source,
      createdAt: new Date(),
    };

    await this.db
      .insert(subscribers)
      .values(values)
      .onConflictDoUpdate({
        target: subscribers.email,
        set: {
          status: "active",
          source,
        },
      });

    const rows = await this.db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, normalizedEmail))
      .limit(1);

    const saved = rows[0] || values;

    return {
      id: saved.id,
      email: saved.email,
      createdAt: saved.createdAt.toISOString(),
      status: saved.status as "active" | "unsubscribed",
      source: saved.source,
    };
  }

  async getSubscribers(): Promise<NewsletterSubscriber[]> {
    const rows = await this.db
      .select()
      .from(subscribers)
      .orderBy(desc(subscribers.createdAt));

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      createdAt: r.createdAt.toISOString(),
      status: r.status as "active" | "unsubscribed",
      source: r.source,
    }));
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const result = await this.db
      .delete(subscribers)
      .where(eq(subscribers.id, id));

    return (result.count ?? 0) > 0;
  }
}
