# Admin Panel and Content Composer

The admin interface provides content publishing, media management, account controls, and site administration tools.

---

## 1. Routes and Structure

### `/admin`: Primary Management Dashboard
The admin dashboard (`app/admin/page.tsx`) organizes operations into dedicated tabs:

1. **Overview (`home-overview.tsx`)**:
   Summary cards displaying counts for posts, notes, books, now entries, media assets, and subscribers.
2. **Content Manager (`content-manager.tsx`)**:
   Searchable and filterable data tables for essays, atomic notes, library books, and living timeline entries. Supports status toggles (published or unpublished), deletion, and links to edit items in the composer.
3. **Featured Manager**:
   Selects and reorders the featured essays and books displayed on the homepage.
4. **Media Manager (`media-manager.tsx`)**:
   Uploads image assets, manages flexible tags, inspects dimensions, and scans for orphaned storage files that are no longer referenced in content.
5. **Account Manager (`account-manager.tsx`)**:
   Manages WebAuthn passkeys, displays active authenticated sessions with device telemetry, and allows linking or unlinking OAuth providers (Google, GitHub).
6. **Subscriber Manager (`subscriber-manager.tsx`)**:
   Lists newsletter subscribers with status and registration source, including options to remove subscribers.

---

### `/admin/compose`: MDX Composer Workspace
The composer (`app/admin/compose/page.tsx`) is a dedicated writing environment:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: [Doc Type] [Slug Input] [Status Badge] [Diff] [Media] [Save]  │
├───────────────────────────────────┬────────────────────────────────────┤
│                                   │                                    │
│        Left: Raw MDX Editor       │      Right: Split Preview Pane     │
│  Monospace editor with line       │  Real-time rendered preview using  │
│  numbers, word count, and reading │  Newsreader typography, figures,   │
│  time indicator.                  │  footnotes, and embedded cards.    │
│                                   │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│ Drawers and Modals:                                                    │
│  - Metadata Settings: Persona, tags, date, cover image, audience.      │
│  - AI Metadata: Automatic persona and tag suggestion via Groq/OpenAI.  │
│  - Visual Diff: Character and line-level changes before publishing.    │
│  - Media Drawer: One-click insertion of uploaded image markdown.       │
│  - Book Cover Picker: Pexels image search for book artwork.            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server Actions (`app/admin/actions.ts`)

All administrative operations execute through Server Actions. Every action enforces:
1. **Authentication and Authorization**: Calls `assertAdminUser()` to verify active session and `content_admin` or `super_admin` role.
2. **Schema Validation**: Validates client-supplied data against Zod schemas.
3. **Cache Revalidation**: Calls `revalidatePath()` on affected routes.

### Complete Action Registry

| Category | Function | Purpose |
| :--- | :--- | :--- |
| **Posts** | `getAllPostsAction` | Fetch all posts, including unpublished drafts |
| | `savePostAction` | Create or update an essay |
| | `togglePostStatusAction` | Toggle between published and unpublished |
| | `deletePostAction` | Delete an essay by slug |
| **Notes** | `getAllNotesAction` | Fetch all atomic notes |
| | `saveNoteAction` | Create or update a note |
| | `toggleNoteStatusAction` | Toggle note publication status |
| | `deleteNoteAction` | Delete a note by slug |
| **Books** | `getAllBooksAction` | Fetch all library books |
| | `saveBookAction` | Create or update a book record |
| | `toggleBookStatusAction` | Toggle book recommendation status |
| | `deleteBookAction` | Delete a book by slug |
| **Now** | `getNowEntriesAction` | Fetch timeline entries |
| | `saveNowEntryAction` | Create or update a now entry |
| | `deleteNowEntryAction` | Delete a timeline entry |
| **Media** | `getMediaAction` | Fetch uploaded media catalog |
| | `addMediaAction` | Upload asset to Supabase Storage and record in database |
| | `deleteMediaAction` | Delete media record from database |
| | `deleteOrphanedMediaAction` | Batch clean unreferenced storage files |
| **Featured** | `setFeaturedPostsAction` | Update homepage featured essay slugs |
| | `setFeaturedBooksAction` | Update homepage featured book slugs |
| **AI Assist** | `generateAiMetadataAction` | Suggest persona, tags, and summary for content |
| **Passkeys** | `getPasskeysAction` | List registered passkeys for current admin |
| | `startPasskeyRegistrationAction`| Generate signed WebAuthn challenge |
| | `verifyPasskeyRegistrationAction`| Verify WebAuthn response and save credential |
| | `deletePasskeyAction` | Remove a passkey credential |
| **Sessions** | `getSessionsAction` | List active sessions |
| | `signOutSessionAction` | Invalidate a specific session |
| | `signOutAllSessionsAction` | Invalidate all sessions except current |
| **Providers** | `connectProviderAction` | Link an OAuth provider |
| | `disconnectProviderAction` | Unlink an OAuth provider |
| **Subscribers**| `subscribeToNewsletterAction` | Register a new subscriber |
| | `deleteSubscriberAction` | Remove a subscriber |
