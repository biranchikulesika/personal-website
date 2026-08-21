# Components & Design System

This document explains the component architecture, reusable UI primitives, and visual design conventions.

---

## 1. Component Hierarchy & Organization

```
components/
├── ui/                     # Reusable design primitives (Atomic UI)
│   ├── actions-menu.tsx    # Dropdown action menus with click-outside
│   ├── badge.tsx           # Persona badges & publication status pills
│   ├── dialog.tsx          # Accessible modal dialog with focus traps
│   ├── essay-cover.tsx     # Typographic SVG/Canvas cover artwork
│   ├── media-picker-modal.tsx # Media gallery selection modal
│   ├── segmented-control.tsx # Sliding pill switchers
│   ├── states.tsx          # Standardized empty, error, loading, 404 views
│   └── use-click-outside.ts# Click outside & Escape key hook
├── admin/                  # Administrative management views
│   ├── compose/            # Composer, live preview, diff viewer, media drawer
│   ├── admin-dashboard.tsx
│   ├── content-manager.tsx
│   ├── featured-manager.tsx
│   └── media-manager.tsx
├── blog-post.tsx           # Essay reader view
├── footer.tsx              # Global footer with bio & categorized links
├── homepage-hero.tsx       # Homepage header with portrait & intro
├── homepage-sections.tsx   # Homepage sections for writing, notes, books
├── icons.tsx               # Scalable SVG icons
├── navbar.tsx              # Sticky header with accessible mobile drawer
├── note-page.tsx           # Atomic note reader view
├── now-page.tsx            # Living timeline reader view
├── scribble-page.tsx       # Unified search/filter content stream
└── support-page.tsx        # Typographic patronage ledger & checkout modal
```

---

## 2. Reusable UI Primitives (`components/ui/`)

### 1. Standardized State Views (`components/ui/states.tsx`)
Always reuse these standardized views instead of creating custom empty/loading markup:

- **`LoadingState({ title })`**: Accessible `role="status"` live region for async data fetching.
- **`ErrorState({ title, description, onRetry })`**: Error state with integrated retry button.
- **`NoSearchResults({ query, onReset })`**: Displayed when search filters yield zero matches.
- **`NoContentState({ title, description })`**: Empty collection view with friendly editorial copy.
- **`EmptyTableState({ colSpan, title, description })`**: Clean table row empty placeholder.
- **`NotFoundState({ title, description })`**: 404 inline page state.
- **`UnauthorizedState({ title, description })`**: Access restricted placeholder.

### 2. Accessible Modal Dialog (`components/ui/dialog.tsx`)
- Provides keyboard accessible dialog overlays (`role="dialog"`), Escape key listeners, body scroll locks, and backdrop blur.

### 3. Persona Badges (`components/ui/badge.tsx`)
- Color-coded badges mapping to the 4 persona themes:
  - `builder`: Rust amber (`#d97706`)
  - `operator`: Slate blue
  - `thinker`: Sage olive
  - `wanderer`: Sand ochre

---

## 3. Visual Design Philosophy & Conventions

1. **Card-Free Editorial Layouts**:
   - The platform strictly rejects heavy rectangular card boxes with arbitrary drop shadows.
   - Replaces card grids with **open typographic horizontal ledgers** separated by subtle dividers (`border-tinted/10`).
2. **Typography First**:
   - **Body Text**: Space Grotesk (`font-sans`) for crisp legibility and metadata.
   - **Editorial Headings & Prose**: Newsreader (`font-serif`) in regular and italic weights for a timeless literary feel.
3. **Palette**:
   - **Night Background**: Deep charcoal `#141413`.
   - **Paper Foreground**: Warm off-white `#FAF9F5`.
   - **Tinted Borders**: Muted subtle borders (`rgba(250, 249, 245, 0.1)`).
4. **Interactive States**:
   - Buttons and links use soft transitions (`transition-colors duration-200`) and subtle hover lifts.
