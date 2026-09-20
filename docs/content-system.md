# Content and Publishing System

The website features an editorial content engine supporting long-form essays, atomic notes, a curated reading catalog, living timeline entries, and an aggregated content feed.

---

## 1. Content Models

### 1. Posts (`BlogPost`)
- **Route**: `/p/[slug]`
- **Description**: Long-form essays with section headings, callouts, blockquotes, figure illustrations, and embedded book recommendations.
- **Data Model**:
  ```typescript
  export interface BlogPost {
    slug: string;
    title: string;
    subtitle?: string;
    description: string;
    persona?: Persona;
    tags: string[];
    publishedAt: string;
    lastEditedAt: string;
    targetAudience: string;
    intro: string[];
    sections: PostSection[];
    books: BookCard[];
    coverImage?: string;
    status?: 'published' | 'unpublished';
  }
  ```

### 2. Notes (`NoteItem`)
- **Route**: `/n/[slug]`
- **Description**: Short-form, atomic observations and thoughts.
- **Data Model**:
  ```typescript
  export interface NoteItem {
    id: string;
    slug: string;
    title: string;
    subtitle?: string;
    description: string;
    content: string[];
    date: string;
    persona: Persona;
    tags: string[];
    coverImage?: string;
    status?: 'published' | 'unpublished';
  }
  ```

### 3. Books (`BookItem`)
- **Route**: `/library`
- **Description**: Curated reading log containing books with cover artwork, author, description, tags, and outbound recommendation links.

### 4. Now Entries (`NowEntry`)
- **Route**: `/now`
- **Description**: Living chronological snapshots of current focus, active projects, and daily rhythms.
- **Identity**: Each entry has a unique `id` and a URL-friendly `slug` derived from the entry title.

### 5. Scribble (`ScribbleEntry`)
- **Route**: `/scribble`
- **Description**: A unified, client-searchable feed aggregating published essays and notes in chronological order.

---

## 2. Personas

Content can be classified under one of four personas:

1. **`builder`**: Software engineering, architecture, code craft, technical projects.
2. **`operator`**: Productivity, execution, workflows, cybersecurity, systems.
3. **`thinker`**: Philosophy, epistemology, mental models, deep reflections.
4. **`wanderer`**: Travel, observation, photography, culture, personal stories.

Personas are represented visually via persona badge pills (`components/persona-badge.tsx`) and used for filtering on `/scribble`.

---

## 3. MDX Processing and Evaluation

MDX handling is divided between rendering and data persistence:

### 1. Rendering (`lib/mdx.tsx`)
Public reading views and composer live previews evaluate markdown using `@mdx-js/mdx` and `remark-gfm`:
- Supports standard CommonMark and GitHub Flavored Markdown (tables, task lists, footnotes, strikethrough).
- Custom JSX components can be embedded directly in content:
  - `<Book slug="..." />`: Renders an interactive book recommendation card.
  - `<Post slug="..." />`: Renders an embedded post link card.
  - `<Note slug="..." />`: Renders an embedded note card.
  - `<Figure src="..." alt="..." caption="..." />`: Renders an accessible figure image.
  - `<YouTube id="..." />`: Embeds a privacy-enhanced YouTube video.
- Includes code block syntax highlighting with a one-click copy button.

### 2. Section Parsing and Serialization (`lib/utils.ts`)
Posts can be stored as structured sections in PostgreSQL JSONB columns:
- **`markdownToPostSections(markdown)`**: Parses raw markdown into structured sections, identifying headings, body paragraphs, quotes, and figures.
- **`sectionsToMarkdown({ intro, sections })`**: Serializes structured database sections back into standard markdown text for editing inside the composer.

---

## 4. Publishing Flow and Cache Invalidation

```text
[ Composer: Draft / Edit ]
           │
           │ savePostAction()
           ▼
[ Database Update (PostgreSQL) ]
           │
           │ revalidatePath()
           ▼
[ Next.js Cache Revalidated ]
           │
           ▼
[ Live on Website ]
```

1. **Unpublished Content**:
   Items marked `status: 'unpublished'` remain visible only within the `/admin` area. Public feeds (`/scribble`, `/library`, homepage) exclude unpublished records. If an anonymous user attempts to visit an unpublished slug, the server returns 404 or `robots: { index: false }`.

2. **Slug Uniqueness**:
   Database triggers guarantee that a slug cannot be shared between posts, notes, and books.

3. **On-Demand Revalidation**:
   When content is saved or its status toggled, server actions call `revalidatePath()` for `/admin`, the content listing (`/scribble` or `/library`), and the item's individual URL. The next visitor receives the updated content immediately.
