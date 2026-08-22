import { getSupabaseAdmin } from "@/lib/supabase/server";
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
  Persona,
  PostSection,
  ScribbleEntry,
  SectionGroup,
  UserRole,
  UserSession,
  WritingItem,
} from "@/lib/types";
import type { ContentRepository } from "./content.repository";

// ── Row types (Supabase → TypeScript) ──────────────────────────────────────
// These represent the raw database row format. The repository maps between
// these and the domain types used by the service layer.

interface PostRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  persona: string | null;
  tags: string[];
  published_at: string | null;
  last_edited_at: string | null;
  assumed_audience: string;
  intro: string[];
  sections: PostSection[];
  books: BookCard[];
  cover_image: string | null;
  status: "published" | "unpublished";
}

interface NoteRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  content: string[];
  date: string | null;
  persona: string | null;
  tags: string[];
  cover_image: string | null;
  status: "published" | "unpublished";
}

interface BookRow {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  date: string | null;
  persona: string | null;
  tags: string[];
  cover: string | null;
  link: string | null;
}

interface NowRow {
  id: string;
  title: string;
  date: string;
  content: string;
}

interface MediaRow {
  id: string;
  name: string;
  src: string;
  alt: string;
  size: string;
  dimensions: string | null;
  uploaded_at: string | null;
  tag: "profile" | "atmosphere" | "post" | "book";
}

// ── Mappers ────────────────────────────────────────────────────────────────

function postRowToDomain(row: PostRow): BlogPost {
  return {
    slug: row.slug,
    // id is available as row.id for production use
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    description: row.description,
    persona: (row.persona as Persona) ?? undefined,
    tags: row.tags ?? [],
    publishedAt: row.published_at ?? "",
    lastEditedAt: row.last_edited_at ?? "",
    assumedAudience: row.assumed_audience ?? "",
    intro: (row.intro as string[]) ?? [],
    sections: (row.sections as unknown as PostSection[]) ?? [],
    books: (row.books as unknown as BookCard[]) ?? [],
    coverImage: row.cover_image ?? undefined,
    status: row.status,
  };
}

function noteRowToDomain(row: NoteRow): NoteItem {
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
    coverImage: row.cover_image ?? undefined,
    status: row.status,
  };
}

function bookRowToDomain(row: BookRow): BookItem {
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
  };
}

function nowRowToDomain(row: NowRow): NowEntry {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    content: row.content,
  };
}

function mediaRowToDomain(row: MediaRow): MediaItem {
  return {
    id: row.id,
    name: row.name,
    src: row.src,
    alt: row.alt,
    size: row.size,
    dimensions: row.dimensions ?? undefined,
    uploadedAt: row.uploaded_at ?? "",
    tag: row.tag,
  };
}

// ── Repository ─────────────────────────────────────────────────────────────
// Production Supabase implementation of the ContentRepository interface.
// Uses the service-role admin client to bypass RLS for admin operations.
// Public read operations could use the publishable-key client with RLS,
// but for simplicity we use the admin client for all queries since the
// repository is only called from trusted server-side contexts.

export class SupabaseContentRepository implements ContentRepository {
  private get db() {
    return getSupabaseAdmin();
  }

  // ── Home Content ───────────────────────────────────────────────────────

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
    const { data, error } = await this.db
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw new Error(`Failed to load writing: ${error.message}`);

    const items: WritingItem[] = (data as PostRow[]).map((row) => ({
      id: row.slug,
      slug: row.slug,
      title: row.title,
      description: row.description,
      date: row.published_at ?? "",
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
    const { data, error } = await this.db
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load library: ${error.message}`);

    return {
      title: "Library",
      href: "/library",
      subheader: "Books that shaped my thinking",
      items: (data as BookRow[]).map(bookRowToDomain) as BookItem[],
    };
  }

  // ── Posts ──────────────────────────────────────────────────────────────

  async getPost(slug: string): Promise<BlogPost | null> {
    const { data, error } = await this.db
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return postRowToDomain(data as PostRow);
  }

  async getPostSlugs(): Promise<string[]> {
    const { data, error } = await this.db
      .from("posts")
      .select("slug")
      .eq("status", "published");

    if (error) throw new Error(`Failed to load post slugs: ${error.message}`);
    return (data as { slug: string }[]).map((r) => r.slug);
  }

  async getAllPosts(): Promise<BlogPost[]> {
    const { data, error } = await this.db
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load posts: ${error.message}`);
    return (data as PostRow[]).map(postRowToDomain);
  }

  async savePost(
    post: BlogPost,
    persona: Persona = "builder",
  ): Promise<BlogPost> {
    const status = post.status || "published";

    // Check for slug collision in other collections on insert
    const { data: existing } = await this.db
      .from("notes")
      .select("slug")
      .eq("slug", post.slug)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error(
        `Slug "${post.slug}" already exists. Choose a unique slug.`,
      );
    }

    const { data: existingBook } = await this.db
      .from("books")
      .select("slug")
      .eq("slug", post.slug)
      .limit(1);

    if (existingBook && existingBook.length > 0) {
      throw new Error(
        `Slug "${post.slug}" already exists. Choose a unique slug.`,
      );
    }

    const row = {
      id: (post as unknown as { id?: string }).id,
      slug: post.slug,
      title: post.title,
      subtitle: post.subtitle ?? null,
      description: post.description,
      persona: persona,
      tags: post.tags,
      published_at: post.publishedAt || null,
      last_edited_at: post.lastEditedAt || null,
      assumed_audience: post.assumedAudience,
      intro: post.intro,
      sections: post.sections,
      books: post.books,
      cover_image: post.coverImage ?? null,
      status,
    };

    const { error } = await this.db
      .from("posts")
      .upsert(row, { onConflict: "slug" });

    if (error) throw new Error(`Failed to save post: ${error.message}`);

    return { ...post, status };
  }

  async togglePostStatus(slug: string): Promise<BlogPost | null> {
    const post = await this.getPost(slug);
    if (!post) return null;

    const nextStatus =
      post.status === "unpublished" ? "published" : "unpublished";

    const { error } = await this.db
      .from("posts")
      .update({ status: nextStatus })
      .eq("slug", slug);

    if (error)
      throw new Error(`Failed to toggle post status: ${error.message}`);
    return { ...post, status: nextStatus };
  }

  async deletePost(slug: string): Promise<boolean> {
    const { error, count } = await this.db
      .from("posts")
      .delete()
      .eq("slug", slug);

    if (error) throw new Error(`Failed to delete post: ${error.message}`);
    return (count ?? 0) > 0;
  }

  // ── Notes ──────────────────────────────────────────────────────────────

  async getNote(slug: string): Promise<NoteItem | null> {
    const { data, error } = await this.db
      .from("notes")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return noteRowToDomain(data as NoteRow);
  }

  async getNoteSlugs(): Promise<string[]> {
    const { data, error } = await this.db
      .from("notes")
      .select("slug")
      .eq("status", "published");

    if (error) throw new Error(`Failed to load note slugs: ${error.message}`);
    return (data as { slug: string }[]).map((r) => r.slug);
  }

  async getAllNotes(): Promise<NoteItem[]> {
    const { data, error } = await this.db
      .from("notes")
      .select("*")
      .order("date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load notes: ${error.message}`);
    return (data as NoteRow[]).map(noteRowToDomain);
  }

  async saveNote(note: NoteItem): Promise<NoteItem> {
    const status = note.status || "published";

    // Check for slug collision in other collections on insert
    const { data: existing } = await this.db
      .from("posts")
      .select("slug")
      .eq("slug", note.slug)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error(
        `Slug "${note.slug}" already exists. Choose a unique slug.`,
      );
    }

    const { data: existingBook } = await this.db
      .from("books")
      .select("slug")
      .eq("slug", note.slug)
      .limit(1);

    if (existingBook && existingBook.length > 0) {
      throw new Error(
        `Slug "${note.slug}" already exists. Choose a unique slug.`,
      );
    }

    const row = {
      id: note.id,
      slug: note.slug,
      title: note.title,
      subtitle: note.subtitle ?? null,
      description: note.description,
      content: note.content,
      date: note.date || null,
      persona: note.persona,
      tags: note.tags,
      cover_image: note.coverImage ?? null,
      status,
    };

    const { error } = await this.db
      .from("notes")
      .upsert(row, { onConflict: "slug" });

    if (error) throw new Error(`Failed to save note: ${error.message}`);
    return { ...note, status };
  }

  async toggleNoteStatus(slug: string): Promise<NoteItem | null> {
    const note = await this.getNote(slug);
    if (!note) return null;

    const nextStatus =
      note.status === "unpublished" ? "published" : "unpublished";

    const { error } = await this.db
      .from("notes")
      .update({ status: nextStatus })
      .eq("slug", slug);

    if (error)
      throw new Error(`Failed to toggle note status: ${error.message}`);
    return { ...note, status: nextStatus };
  }

  async deleteNote(slug: string): Promise<boolean> {
    const { error, count } = await this.db
      .from("notes")
      .delete()
      .eq("slug", slug);

    if (error) throw new Error(`Failed to delete note: ${error.message}`);
    return (count ?? 0) > 0;
  }

  // ── Books ──────────────────────────────────────────────────────────────

  async getAllBooks(): Promise<BookItem[]> {
    const { data, error } = await this.db
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load books: ${error.message}`);
    return (data as BookRow[]).map(bookRowToDomain);
  }

  async saveBook(book: BookItem): Promise<BookItem> {
    // Check for slug collision in other collections on insert
    const { data: existingPost } = await this.db
      .from("posts")
      .select("slug")
      .eq("slug", book.slug)
      .limit(1);

    if (existingPost && existingPost.length > 0) {
      throw new Error(
        `Slug "${book.slug}" already exists. Choose a unique slug.`,
      );
    }

    const { data: existingNote } = await this.db
      .from("notes")
      .select("slug")
      .eq("slug", book.slug)
      .limit(1);

    if (existingNote && existingNote.length > 0) {
      throw new Error(
        `Slug "${book.slug}" already exists. Choose a unique slug.`,
      );
    }

    const row = {
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
    };

    const { error } = await this.db
      .from("books")
      .upsert(row, { onConflict: "id" });

    if (error) throw new Error(`Failed to save book: ${error.message}`);
    return book;
  }

  async deleteBook(slug: string): Promise<boolean> {
    const { error, count } = await this.db
      .from("books")
      .delete()
      .eq("slug", slug);

    if (error) throw new Error(`Failed to delete book: ${error.message}`);
    return (count ?? 0) > 0;
  }

  // ── Scribble ───────────────────────────────────────────────────────────

  async getScribbleEntries(): Promise<ScribbleEntry[]> {
    const [posts, notes, books] = await Promise.all([
      this.getAllPosts(),
      this.getAllNotes(),
      this.getAllBooks(),
    ]);

    const essays: ScribbleEntry[] = posts
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

    const noteEntries: ScribbleEntry[] = notes
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

    const bookEntries: ScribbleEntry[] = books.map((book) => ({
      id: book.id,
      type: "book" as const,
      title: book.title,
      description: book.description,
      date: book.date,
      persona: book.persona,
      topics: book.tags,
      href: "/library",
      author: book.author,
    }));

    return [...essays, ...noteEntries, ...bookEntries];
  }

  // ── Now ────────────────────────────────────────────────────────────────

  async getNowEntries(): Promise<NowEntry[]> {
    const { data, error } = await this.db
      .from("now_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw new Error(`Failed to load now entries: ${error.message}`);
    return (data as NowRow[]).map(nowRowToDomain);
  }

  async saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    const row = {
      id: entry.id,
      title: entry.title,
      date: entry.date,
      content: entry.content.trim(),
    };

    const { error } = await this.db
      .from("now_entries")
      .upsert(row, { onConflict: "id" });

    if (error) throw new Error(`Failed to save now entry: ${error.message}`);
    return { ...entry, content: entry.content.trim() };
  }

  async deleteNowEntry(id: string): Promise<boolean> {
    const { error, count } = await this.db
      .from("now_entries")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete now entry: ${error.message}`);
    return (count ?? 0) > 0;
  }

  // ── Media ──────────────────────────────────────────────────────────────

  async getMedia(): Promise<MediaItem[]> {
    const { data, error } = await this.db
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load media: ${error.message}`);
    return (data as MediaRow[]).map(mediaRowToDomain);
  }

  async addMedia(item: MediaItem): Promise<MediaItem> {
    let finalSrc = item.src;

    // If item.src is a Base64 data URL, upload to Supabase Storage if available
    if (item.src.startsWith("data:")) {
      try {
        const matches = item.src.match(
          /^data:(image\/([a-zA-Z0-9+.-]+));base64,(.+)$/,
        );
        if (matches) {
          const mimeType = matches[1];
          const ext = matches[2] === "jpeg" ? "jpg" : matches[2];
          const base64Data = matches[3];
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `${Date.now()}-${item.name.replace(/[^a-zA-Z0-9.-]/g, "_")}.${ext}`;
          const storagePath = `uploads/${fileName}`;

          const { data: uploadData, error: uploadError } = await this.db.storage
            .from("media")
            .upload(storagePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = this.db.storage
              .from("media")
              .getPublicUrl(storagePath);
            if (publicUrlData?.publicUrl) {
              finalSrc = publicUrlData.publicUrl;
            }
          }
        }
      } catch {
        // Fallback to storing the data URL directly in database
      }
    }

    const row = {
      id: item.id,
      name: item.name,
      src: finalSrc,
      alt: item.alt,
      size: item.size,
      dimensions: item.dimensions ?? null,
      uploaded_at: item.uploadedAt || null,
      tag: item.tag,
    };

    const { error } = await this.db
      .from("media")
      .upsert(row, { onConflict: "id" });

    if (error) throw new Error(`Failed to add media: ${error.message}`);
    return { ...item, src: finalSrc };
  }

  async deleteMedia(id: string): Promise<boolean> {
    const { error, count } = await this.db.from("media").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete media: ${error.message}`);
    return (count ?? 0) > 0;
  }

  async getOrphanedMedia(): Promise<MediaItem[]> {
    // In production, this would query the Supabase Storage bucket listing
    // and cross-reference against all content references.
    // For now, return empty — orphaned media detection requires the Storage API.
    return [];
  }

  async deleteStorageAssets(srcs: string[]): Promise<number> {
    if (srcs.length === 0) return 0;

    // In production, delete from Supabase Storage bucket.
    // For now, remove from the storage_files tracking table.
    const { error, count } = await this.db
      .from("storage_files")
      .delete()
      .in("path", srcs);

    if (error)
      throw new Error(`Failed to delete storage assets: ${error.message}`);
    return count ?? 0;
  }

  // ── User Roles ─────────────────────────────────────────────────────────

  async getUserRole(userId: string): Promise<AppRole | null> {
    const { data, error } = await this.db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data.role as AppRole;
  }

  async setUserRole(userId: string, role: AppRole): Promise<void> {
    const { error } = await this.db
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });

    if (error) throw new Error(`Failed to set user role: ${error.message}`);
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    const { data, error } = await this.db.from("user_roles").select("*");

    if (error) throw new Error(`Failed to load user roles: ${error.message}`);
    return (data as { user_id: string; role: string }[]).map((row) => ({
      userId: row.user_id,
      role: row.role as AppRole,
    }));
  }

  // ── Featured Items ─────────────────────────────────────────────────────

  async getFeaturedPosts(): Promise<string[]> {
    const { data, error } = await this.db
      .from("featured_items")
      .select("item_id")
      .eq("item_type", "post")
      .order("position");

    if (error)
      throw new Error(`Failed to load featured posts: ${error.message}`);
    return (data as { item_id: string }[]).map((r) => r.item_id);
  }

  async getFeaturedBooks(): Promise<string[]> {
    const { data, error } = await this.db
      .from("featured_items")
      .select("item_id")
      .eq("item_type", "book")
      .order("position");

    if (error)
      throw new Error(`Failed to load featured books: ${error.message}`);
    return (data as { item_id: string }[]).map((r) => r.item_id);
  }

  async setFeaturedPosts(slugs: string[]): Promise<void> {
    // Delete existing featured posts
    await this.db.from("featured_items").delete().eq("item_type", "post");

    // Insert new featured posts
    if (slugs.length > 0) {
      const rows = slugs.map((slug, i) => ({
        item_type: "post" as const,
        item_id: slug,
        position: i + 1,
      }));
      const { error } = await this.db.from("featured_items").insert(rows);
      if (error)
        throw new Error(`Failed to set featured posts: ${error.message}`);
    }
  }

  async setFeaturedBooks(slugs: string[]): Promise<void> {
    // Delete existing featured books
    await this.db.from("featured_items").delete().eq("item_type", "book");

    // Insert new featured books
    if (slugs.length > 0) {
      const rows = slugs.map((slug, i) => ({
        item_type: "book" as const,
        item_id: slug,
        position: i + 1,
      }));
      const { error } = await this.db.from("featured_items").insert(rows);
      if (error)
        throw new Error(`Failed to set featured books: ${error.message}`);
    }
  }

  // ── Contributions & Patronage ───────────────────────────────────────────

  async recordContribution(contribution: Contribution): Promise<Contribution> {
    const row = {
      id: contribution.id,
      order_id: contribution.orderId ?? null,
      payment_id: contribution.paymentId ?? null,
      amount: contribution.amount,
      currency: contribution.currency,
      status: contribution.status,
      name: contribution.name,
      email: contribution.email ?? null,
      note: contribution.note ?? null,
      created_at: contribution.createdAt,
      source: contribution.source,
    };

    const { error } = await this.db
      .from("contributions")
      .upsert(row, { onConflict: "id" });

    if (error)
      throw new Error(`Failed to record contribution: ${error.message}`);
    return contribution;
  }

  async getContribution(id: string): Promise<Contribution | null> {
    const { data, error } = await this.db
      .from("contributions")
      .select("*")
      .or(`id.eq.${id},payment_id.eq.${id},order_id.eq.${id}`)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      orderId: data.order_id ?? undefined,
      paymentId: data.payment_id ?? undefined,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      name: data.name,
      email: data.email ?? undefined,
      note: data.note ?? undefined,
      createdAt: data.created_at,
      source: data.source,
    };
  }

  async getContributions(): Promise<Contribution[]> {
    const { data, error } = await this.db
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`Failed to load contributions: ${error.message}`);
    return (data as Record<string, unknown>[]).map((d) => ({
      id: d.id as string,
      orderId: (d.order_id as string) ?? undefined,
      paymentId: (d.payment_id as string) ?? undefined,
      amount: d.amount as number,
      currency: d.currency as string,
      status: d.status as Contribution["status"],
      name: d.name as string,
      email: (d.email as string) ?? undefined,
      note: (d.note as string) ?? undefined,
      createdAt: d.created_at as string,
      source: (d.source as Contribution["source"]) ?? "razorpay",
    }));
  }

  // ── Passkeys & Auth ─────────────────────────────────────────────────────

  async getPasskeys(userId: string): Promise<PasskeyItem[]> {
    try {
      const { data, error } = await this.db.auth.admin.listUsers();
      if (error) return [];
      const user = data.users.find((u) => u.id === userId);
      if (!user) return [];

      // If user has factors with webauthn
      const factors =
        user.factors?.filter((f) => f.factor_type === "webauthn") || [];
      return factors.map((f) => ({
        id: f.id,
        label: f.friendly_name || "Security Key / Passkey",
        createdAt: f.created_at,
        lastUsedAt: f.updated_at
          ? new Date(f.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recently",
      }));
    } catch {
      return [];
    }
  }

  async savePasskey(
    _userId: string,
    passkey: PasskeyItem,
  ): Promise<PasskeyItem> {
    return passkey;
  }

  async deletePasskey(userId: string, passkeyId: string): Promise<boolean> {
    try {
      const { error } = await this.db.auth.admin.mfa.deleteFactor({
        userId,
        id: passkeyId,
      });
      return !error;
    } catch {
      return false;
    }
  }

  // ── Active Sessions ─────────────────────────────────────────────────────

  async getSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<UserSession[]> {
    try {
      const { data } = await this.db.auth.admin.getUserById(userId);
      const lastSignIn = data.user?.last_sign_in_at || new Date().toISOString();
      return [
        {
          id: currentSessionId || "session-primary",
          userId,
          device: "Current Device",
          location: "Active Connection",
          startedAt: new Date(lastSignIn).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          lastActiveAt: lastSignIn,
          isCurrent: true,
        },
      ];
    } catch {
      return [];
    }
  }

  async recordSession(session: UserSession): Promise<UserSession> {
    return session;
  }

  async deleteSession(_userId: string, _sessionId: string): Promise<boolean> {
    return true;
  }

  async deleteAllSessions(userId: string): Promise<boolean> {
    try {
      const { error } = await this.db.auth.admin.signOut(userId, "global");
      return !error;
    } catch {
      return false;
    }
  }

  // ── Connected Accounts ──────────────────────────────────────────────────

  async getConnectedProviders(userId: string): Promise<string[]> {
    try {
      const { data } = await this.db.auth.admin.getUserById(userId);
      if (!data.user) return ["google"];
      const identities = data.user.identities || [];
      const providers = identities.map((i) => i.provider);
      return providers.length > 0 ? providers : ["google"];
    } catch {
      return ["google"];
    }
  }

  async setConnectedProviders(
    _userId: string,
    _providers: string[],
  ): Promise<void> {
    // Identity linking is managed directly via Supabase Auth OAuth flow
  }

  // ── Newsletter Subscribers ──────────────────────────────────────────────

  async addSubscriber(
    email: string,
    source: string = "website",
  ): Promise<NewsletterSubscriber> {
    const normalizedEmail = email.trim().toLowerCase();
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const { data, error } = await this.db
      .from("subscribers")
      .upsert(
        {
          id,
          email: normalizedEmail,
          status: "active",
          source,
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save subscriber: ${error.message}`);
    }

    return {
      id: data.id,
      email: data.email,
      createdAt: data.created_at,
      status: data.status as "active" | "unsubscribed",
      source: data.source,
    };
  }

  async getSubscribers(): Promise<NewsletterSubscriber[]> {
    const { data, error } = await this.db
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load subscribers: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
      status: row.status as "active" | "unsubscribed",
      source: row.source,
    }));
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const { error } = await this.db.from("subscribers").delete().eq("id", id);

    return !error;
  }
}
