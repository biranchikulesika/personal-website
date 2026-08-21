# Styling & Theming

The application uses **Tailwind CSS v4** paired with `@tailwindcss/typography` and Google Fonts loaded via `next/font/google`.

---

## 1. Tailwind CSS v4 Configuration

Tailwind v4 uses CSS-first configuration inside [`app/globals.css`](file:///home/biranchikulesika/Projects/biranchi/app/globals.css).

### Color Palette

```css
:root {
  --bg-night: #141413;       /* Primary dark canvas */
  --bg-night-soft: #1c1c1a;  /* Elevated panel background */
  --text-paper: #FAF9F5;     /* Warm white primary text */
  --text-ink-soft: #9E9D96;  /* Secondary muted text */
  --accent: #d97706;         /* Brand amber/rust highlight */
  --accent-hover: #b45309;   /* Hover state highlight */
}
```

### Color Token Utility Mapping:
- **`bg-night`**: Main background (`#141413`).
- **`bg-night-soft`**: Card surfaces, modal headers, dropdown menus (`#1c1c1a`).
- **`text-paper`**: Primary headlines and readable content (`#FAF9F5`).
- **`text-ink-soft`**: Descriptions, captions, and publication metadata (`#9E9D96`).
- **`text-accent` / `bg-accent`**: Highlights, primary buttons, and link underlines.
- **`border-tinted/10` / `border-tinted/20`**: Subtle, translucent boundary dividers.

---

## 2. Typography & Font Stacks

Fonts are imported with zero layout shift in `app/layout.tsx`:

1. **Sans-Serif (`font-sans`)**:
   - **Font**: `Space_Grotesk` (Google Font).
   - **Variable**: `--font-space-grotesk`.
   - **Usage**: UI controls, navigation links, buttons, metadata pills, system metrics.
2. **Serif (`font-serif`)**:
   - **Font**: `Newsreader` (Google Font in normal and italic styles).
   - **Variable**: `--font-newsreader`.
   - **Usage**: Essay titles, section headers, long-form prose, blockquotes.

---

## 3. Utility Classes & Layout Containers

- **`.container-site`**:
  ```css
  .container-site {
    width: 100%;
    max-width: 72rem; /* 1152px */
    margin-left: auto;
    margin-right: auto;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
  ```
- **`.skip-link`**:
  - Accessible hidden link that becomes visible on keyboard focus to bypass navigation headers directly to `#main-content`.
- **Prose Overrides**:
  - Custom Tailwind typography rules configured for high-contrast reading with styled callouts, blockquotes, and footnote references.
