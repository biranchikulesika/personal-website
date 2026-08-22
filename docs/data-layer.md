# Data Layer Architecture

The data layer provides a clean abstraction between application operations and underlying storage engines. UI components and Server Actions interact solely with the **Service Layer**, which delegates to the **Supabase Repository**.

---

## 1. Abstraction Boundaries & Contract

```
┌────────────────────────────────────────────────────────┐
│               ContentService (Application)             │
│                 lib/services/content.service.ts        │
└───────────────────────────┬────────────────────────────┘
                            │ Calls repository methods
                            ▼
┌────────────────────────────────────────────────────────┐
│          ContentRepository (Interface Contract)        │
│          lib/repositories/content.repository.ts        │
└───────────────────────────┬────────────────────────────┘
                            │ Implemented by
                            ▼
┌────────────────────────────────────────────────────────┐
│               SupabaseContentRepository                │
│       lib/repositories/supabase-content.repository.ts  │
│                 (PostgreSQL / Supabase)                │
└────────────────────────────────────────────────────────┘
```

The repository contract (`lib/repositories/content.repository.ts`) defines all data access methods:

```typescript
export interface ContentRepository {
  // Posts
  getPost(slug: string): Promise<BlogPost | null>;
  getPostSlugs(): Promise<string[]>;
  getAllPosts(): Promise<BlogPost[]>;
  savePost(post: BlogPost, persona?: Persona): Promise<BlogPost>;
  deletePost(slug: string): Promise<boolean>;
  togglePostStatus(slug: string): Promise<BlogPost | null>;

  // Notes
  getNote(slug: string): Promise<NoteItem | null>;
  getNoteSlugs(): Promise<string[]>;
  getAllNotes(): Promise<NoteItem[]>;
  saveNote(note: NoteItem): Promise<NoteItem>;
  deleteNote(slug: string): Promise<boolean>;
  toggleNoteStatus(slug: string): Promise<NoteItem | null>;

  // Books
  getAllBooks(): Promise<BookItem[]>;
  saveBook(book: BookItem): Promise<BookItem>;
  deleteBook(slug: string): Promise<boolean>;

  // Scribble (Aggregated Index)
  getScribbleEntries(): Promise<ScribbleEntry[]>;

  // Now Timeline
  getNowEntries(): Promise<NowEntry[]>;
  saveNowEntry(entry: NowEntry): Promise<NowEntry>;
  deleteNowEntry(id: string): Promise<boolean>;

  // Media
  getMedia(): Promise<MediaItem[]>;
  addMedia(item: MediaItem): Promise<MediaItem>;
  deleteMedia(id: string): Promise<boolean>;
  getOrphanedMedia(): Promise<MediaItem[]>;
  deleteStorageAssets(srcs: string[]): Promise<number>;

  // User Roles & Permissions
  getUserRole(userId: string): Promise<AppRole | null>;
  setUserRole(userId: string, role: AppRole): Promise<void>;
  getAllUserRoles(): Promise<UserRole[]>;

  // Featured Highlights
  getFeaturedPosts(): Promise<string[]>;
  getFeaturedBooks(): Promise<string[]>;
  setFeaturedPosts(slugs: string[]): Promise<void>;
  setFeaturedBooks(slugs: string[]): Promise<void>;

  // Contributions & Patronage
  recordContribution(contribution: Contribution): Promise<Contribution>;
  getContribution(id: string): Promise<Contribution | null>;
  getContributions(): Promise<Contribution[]>;
}
```

---

## 2. Supabase Implementation (`SupabaseContentRepository`)

- **Location**: `lib/repositories/supabase-content.repository.ts`
- **Data Source**: Live PostgreSQL instance via Supabase client.
- **Client**: Uses `getSupabaseAdmin()` (service-role key) to execute operations with full consistency.
- **Row Mapping**: Explicitly maps PostgreSQL snake_case columns (e.g. `published_at`, `cover_image`) to camelCase domain models (`publishedAt`, `coverImage`).

### Repository Export
`lib/repositories/index.ts` provides `getContentRepository()`:

```typescript
export function getContentRepository(): ContentRepository {
  if (!repository) {
    repository = new SupabaseContentRepository();
  }
  return repository;
}
```

---

## 3. Step-by-Step Developer Guides

### How to Add a New Method to the Data Layer

#### Step 1: Define Domain Types in `lib/types.ts`
```typescript
export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}
```

#### Step 2: Add Method to the Repository Interface (`lib/repositories/content.repository.ts`)
```typescript
export interface ContentRepository {
  // ...
  addSubscriber(email: string): Promise<NewsletterSubscriber>;
}
```

#### Step 3: Implement in `SupabaseContentRepository`
```typescript
async addSubscriber(email: string): Promise<NewsletterSubscriber> {
  const { data, error } = await this.db
    .from('subscribers')
    .insert({ email, subscribed_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(`Failed to add subscriber: ${error.message}`);
  return { email: data.email, subscribedAt: data.subscribed_at };
}
```

#### Step 4: Expose via `ContentService` (`lib/services/content.service.ts`)
```typescript
export class ContentService {
  // ...
  async subscribeToNewsletter(email: string): Promise<NewsletterSubscriber> {
    // Validate business rules (e.g. email format)
    if (!email.includes('@')) throw new Error('Invalid email format');
    return this.repo.addSubscriber(email);
  }
}
```
