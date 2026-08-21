# Admin Panel & MDX Composer

The administrative surface provides content management and composition tooling.

---

## 1. Structure & Routes

- **`/admin`** — Primary dashboard.
  - **Overview**: Content counts (posts, notes, books, now entries, media assets).
  - **Content Manager**: Filterable, searchable data tables for essays, notes, and timeline items with status toggles, deletion, and edit triggers.
  - **Featured Manager**: Curates the 4 featured essays and 4 featured books displayed on the homepage.
  - **Media Manager**: Uploads images, inspects asset dimensions, manages tags, and detects orphaned storage assets.
- **`/admin/compose`** — Full-page IDE-grade MDX composition environment.

---

## 2. The Compose Workspace (`components/admin/compose/`)

The Composer is designed for an uninterrupted writing and editing experience:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: [Doc Type] [Slug Input] [Status Badge] [Diff] [Media] [Save]  │
├───────────────────────────────────┬────────────────────────────────────┤
│                                   │                                    │
│        Left: Raw MDX Editor       │      Right: Split Preview Pane     │
│  (Monospace, line numbers, word   │  (Matches live typography styles,  │
│   count, reading time indicator)  │   footnotes, callouts, figures)    │
│                                   │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│ Drawers / Overlays:                                                    │
│  - Metadata Settings: Persona, Tags, Subtitle, Publish Date, Cover Image│
│  - Visual Diff Viewer: Color-coded before/after character comparison   │
│  - Media Asset Drawer: One-click markdown insertion for images         │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Capabilities:
1. **Multi-Type Support**: Switch effortlessly between editing essays (`post`), atomic notes (`note`), and timeline updates (`now`).
2. **Live Render Preview**: Real-time rendering reflecting exact serif fonts (`Newsreader`), sizing, blockquotes, and figures as they appear on the live site.
3. **Visual Diff Engine (`diff-view.tsx`)**: Inspect additions, deletions, and modifications before publishing updates.
4. **Media Drawer (`media-drawer.tsx`)**: Search uploaded assets and insert formatted `![alt](src)` tags with a single click.

---

## 3. Server Actions & Validation (`app/admin/actions.ts`)

All administrative write operations are handled via Server Actions that validate inputs at the server boundary using Zod:

```typescript
export async function savePostAction(
  post: BlogPost,
  persona?: Persona,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    // 1. Strict Zod validation
    const validated = BlogPostSchema.parse(post);

    // 2. Persist via Service layer
    const saved = await contentService.savePost(validated, persona);

    // 3. Trigger on-demand cache revalidation
    revalidatePath('/admin');
    revalidatePath('/scribble');
    revalidatePath(`/p/${post.slug}`);

    return { success: true, post: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save post' };
  }
}
```

### Supported Server Actions:
- **Posts**: `getAllPostsAction`, `savePostAction`, `togglePostStatusAction`, `deletePostAction`.
- **Notes**: `getAllNotesAction`, `saveNoteAction`, `toggleNoteStatusAction`, `deleteNoteAction`.
- **Books**: `getAllBooksAction`, `saveBookAction`, `deleteBookAction`.
- **Now Entries**: `getNowEntriesAction`, `saveNowEntryAction`, `deleteNowEntryAction`.
- **Media**: `getMediaAction`, `addMediaAction`, `deleteMediaAction`, `getOrphanedMediaAction`, `deleteStorageAssetsAction`.
- **Featured**: `setFeaturedPostsAction`, `setFeaturedBooksAction`.
