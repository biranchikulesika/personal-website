# Styling and Theming

The application uses Tailwind CSS v4 with custom theme tokens defined directly in `app/globals.css`, paired with Google Fonts imported through `next/font/google`.

---

## 1. Tailwind CSS Configuration

Tailwind v4 uses CSS-first configuration inside `app/globals.css`.

### Theme Palette

```css
@theme {
  /* Typography */
  --font-sans: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-newsreader), ui-serif, Georgia, serif;

  /* Core Palette */
  --color-paper: #FAF9F5;
  --color-cream: #1c1c1a;
  --color-tinted: #363430;
  --color-night: #141413;
  --color-night-soft: #1c1c1a;
  --color-ink: #141413;
  --color-ink-soft: #B0AEA5;

  /* Accent Palette */
  --color-accent: #D97757;
  --color-accent-hover: #C96442;
  --color-terracotta: #D97757;
  --color-sea-blue: #04A4BA;
  --color-accent-green: #788C5D;

  /* Surfaces */
  --color-post-card: #262522;
  --color-background: #141413;
  --color-foreground: #FAF9F5;
  --color-border: #363430;
}
```

### Color Utility Usage:
- **`bg-night`**: Main application background (`#141413`).
- **`bg-night-soft`**: Secondary panels, dropdown menus, and cards (`#1c1c1a`).
- **`text-paper`**: Primary readable text and headlines (`#FAF9F5`).
- **`text-ink-soft`**: Secondary descriptions, captions, and publication dates (`#B0AEA5`).
- **`text-accent` / `bg-accent`**: Terracotta highlight and call-to-action buttons (`#D97757`).
- **`border-tinted/10` / `border-tinted/20`**: Subtle divider rules between ledger items.

---

## 2. Typography and Font Stacks

Fonts are loaded in `app/layout.tsx` using `next/font/google` with optimal display settings:

1. **Sans-Serif (`font-sans`)**:
   - **Font**: Space Grotesk.
   - **Variable**: `--font-space-grotesk`.
   - **Usage**: Navigation links, buttons, metadata labels, tags, and system controls.
2. **Serif (`font-serif`)**:
   - **Font**: Newsreader (regular and italic).
   - **Variable**: `--font-newsreader`.
   - **Usage**: Essay titles, section headings, long-form reading prose, and quotes.

---

## 3. Layout Utilities

- **`.container-site`**:
  Centers content and restricts maximum width to 72rem (1152px) with horizontal padding on mobile and desktop:
  ```css
  .container-site {
    width: 100%;
    max-width: 72rem;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
  ```
- **`.skip-link`**:
  An accessible link positioned off-screen that becomes visible when focused by keyboard users, allowing them to jump directly to the `#main-content` container.
- **SVG Guard**:
  Global CSS rules prevent SVG child elements (`use`, `path`) from intercepting pointer events, ensuring click events bubble cleanly to parent buttons across all browsers.
