# Content System

The website features an editorial content engine supporting long-form essays, atomic notes, library books, and living timeline entries.

---

## 1. Content Types

### 1. Posts (`BlogPost`)
- **Route**: `/p/[slug]`
- **Characteristics**: Long-form essays with rich editorial typography, callout quotes, captioned figures, footnote citations, and related book cards.
- **Data Structure**:
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
    assumedAudience: string;
    intro: string[];
    sections: PostSection[];
    books: BookCard[];
    coverImage?: string;
    status?: 'published' | 'unpublished';
  }
  ```

### 2. Notes (`NoteItem`)
- **Route**: `/n/[slug]`
- **Characteristics**: Short-form, atomic thoughts or micro-essays. Quick to read and tagged by topic and persona.
- **Data Structure**:
  ```typescript
  export interface NoteItem {
    id: string;
    slug: string;
    title: string;
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
- **Characteristics**: Curated reading log containing books that have shaped thinking. Includes cover artwork, author, key insights, and outbound links.

### 4. Now Entries (`NowEntry`)
- **Route**: `/now`
- **Characteristics**: Living snapshots of current focus, active projects, reading lists, and daily rhythms formatted chronologically.

### 5. Scribble (`ScribbleEntry`)
- **Route**: `/scribble`
- **Characteristics**: A unified, searchable, filterable stream aggregating essays, notes, and library additions in a single chronological feed.

---

## 2. Personas & Content Taxonomies

Content can be categorized under one of four core personas:
1. **`builder`**: Software engineering, system architecture, tools, craft, technical builds.
2. **`operator`**: Productivity, execution, workflows, habits, operational efficiency.
3. **`thinker`**: Philosophy, epistemology, mental models, books, deep inquiry.
4. **`wanderer`**: Observation, travel, photography, culture, personal reflections.

---

## 3. Markdown / MDX Engine (`lib/mdx.ts`)

To allow non-destructive round-tripping between the IDE MDX Composer and structured database rows, `lib/mdx.ts` provides bi-directional transformation:

- **`markdownToPostSections(markdown: string)`**: Parses raw Markdown text into structured `intro`, `sections` (`PostSection[]`), quotes, figures, and footnotes.
- **`sectionsToMarkdown({ intro, sections })`**: Serializes structured sections back into standard GitHub Flavored Markdown with clean headings and frontmatter.

---

## 4. Content Lifecycle & Publishing

```
   [ Draft / Unpublished ]
              │
              │ savePostAction() / togglePostStatusAction()
              ▼
   [ Published to Database ]
              │
              │ revalidatePath('/p/[slug]')
              ▼
   [ Edge Cache Updated & Live on Site ]
```

1. **Unpublished / Draft Status**:
   - Content with `status: 'unpublished'` is visible and editable inside `/admin` but hidden from public feeds (`/scribble`, `/library`, homepage).
   - Direct slug access to unpublished drafts returns HTTP `robots: { index: false, follow: false }` or 404 to non-admin visitors.
2. **Cross-Collection Slug Validation**:
   - A slug cannot collide across posts, notes, or books (enforced by DB triggers and Zod validation).
3. **Automatic Revalidation**:
   - Saving or toggling status triggers Next.js On-Demand Revalidation (`revalidatePath`) for instant cache updates without full redeployments.
