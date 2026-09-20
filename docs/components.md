# Components and Design System

This document explains component organization, reusable primitives, and visual design conventions.

---

## 1. Component Hierarchy

```text
components/
├── admin/                    # Administrative management views and tools
│   ├── compose/              # MDX composer workspace, preview, diff, media drawer
│   ├── account-manager.tsx   # Passkeys, sessions, OAuth provider connections
│   ├── admin-dashboard.tsx   # Tab routing and admin navigation shell
│   ├── book-cover-picker.tsx # Book artwork search via Pexels
│   ├── content-manager.tsx   # Data tables for posts, notes, books, now entries
│   ├── home-overview.tsx     # Overview metrics and recent activity
│   ├── media-manager.tsx     # Media upload, tags, and orphan cleanup
│   └── subscriber-manager.tsx# Newsletter subscriber list
├── blocks/                   # Custom components embedded in MDX content
│   ├── book-block.tsx        # <Book slug="..." /> embedded card
│   ├── library.tsx           # Embedded library section
│   ├── note-block.tsx        # <Note slug="..." /> embedded card
│   └── post-block.tsx        # <Post slug="..." /> embedded card
├── ui/                       # Shared UI primitives
│   ├── book-cover.tsx        # Book cover image with fallback artwork
│   ├── essay-cover.tsx       # Typographic SVG cover for essays
│   ├── states.tsx            # Standardized empty, loading, error, 404 views
│   ├── toast-view.tsx        # Accessible toast notification component
│   ├── use-click-outside.ts  # Custom hook for outside clicks and Escape key
│   └── user-avatar.tsx       # User profile avatar with fallback initials
├── about-page.tsx            # About page presentation
├── blog-post.tsx             # Long-form essay reader view
├── footer.tsx                # Global footer with links and copyright
├── hero.tsx                  # Homepage introductory hero
├── home-content.tsx          # Homepage content sections container
├── icons.tsx                 # Inline SVG icons
├── landscape-gallery.tsx     # About page photographic mosaic
├── library-page.tsx          # Library catalog grid and search
├── library-section.tsx       # Homepage library recommendation section
├── mdx-view.tsx              # MDX evaluation renderer
├── navbar.tsx                # Header navigation with mobile drawer
├── newsletter-form.tsx       # Newsletter signup form
├── note-page.tsx             # Atomic note reader view
├── notes-section.tsx         # Homepage notes section
├── not-found-view.tsx        # 404 state display
├── now-page.tsx              # Living timeline entries list
├── persona-badge.tsx         # Persona indicator pill component
├── scribble-page.tsx         # Searchable feed of essays and notes
├── section-heading.tsx       # Standard section title with link
├── share-menu.tsx            # Social sharing dropdown menu
├── support-page.tsx          # Patronage ledger and Razorpay payment modal
├── svg-element-guard.tsx     # Browser compatibility wrapper for SVGs
└── writing-section.tsx       # Homepage latest essays list
```

---

## 2. Shared State Views (`components/ui/states.tsx`)

To keep empty states and loading indicators consistent, use these shared components instead of inline placeholders:

- **`LoadingState({ title })`**: Accessible `role="status"` region for asynchronous data loading.
- **`NoSearchResults({ query, onReset })`**: Displayed when search or filter combinations yield no results.
- **`NoContentState({ title, description })`**: Friendly placeholder for empty collections.
- **`EmptyTableState({ colSpan, title, description })`**: Table row placeholder for admin tables when no matching records exist.

---

## 3. Visual Design Conventions

1. **Card-Free Editorial Layouts**:
   The website avoids heavy boxed cards with drop shadows. Instead, it uses open typographic horizontal ledgers separated by subtle translucent borders (`border-tinted/10`).

2. **Typography**:
   - **Prose and Headlines**: Newsreader serif font (`font-serif`) for essays, section titles, and quotes.
   - **UI Controls and Metadata**: Space Grotesk sans-serif font (`font-sans`) for navigation links, buttons, dates, tags, and metrics.

3. **Palette**:
   - **Night Background**: `#141413`.
   - **Paper Text**: `#FAF9F5`.
   - **Muted Ink**: `#B0AEA5`.
   - **Terracotta Accent**: `#D97757`.
   - **Sea Blue Accent**: `#04A4BA`.
   - **Sage Green Accent**: `#788C5D`.

4. **Accessibility**:
   All interactive elements include visible keyboard focus rings, semantic HTML structure, and proper ARIA roles (`role="status"`, `aria-expanded`).
