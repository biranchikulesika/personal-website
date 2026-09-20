# Media and Storage

This document describes asset management, storage buckets, image optimization, and dynamic image generation.

---

## 1. Media Model (`lib/types.ts`)

Uploaded assets are cataloged in the `public.media` table:

```typescript
export interface MediaItem {
  id: string;
  name: string;
  src: string;
  alt: string;
  size: string;
  dimensions?: string;
  uploadedAt: string;
  tags: string[];
}
```

### Media Tags
- Tags are free-form strings (`tags: string[]`), such as `essay`, `cover`, `architecture`, `screenshot`, `portrait`, `reading`.
- Multiple tags can be assigned to each asset.
- The media manager filter bar dynamically displays tag options based on existing items in the database.
- Legacy categories (`atmosphere`, `profile`) have been replaced with flexible tags.

---

## 2. Storage Buckets and Policies

Assets are stored in Supabase Storage in the `media` bucket:
- **Bucket Name**: `media`
- **Public URL**: Enabled (`public: true`)
- **Maximum File Size**: 50 MB
- **Allowed Formats**: JPEG, PNG, WebP, GIF, SVG, PDF

### Access Policies:
- **Read**: Public anonymous access via CDN URLs.
- **Write and Delete**: Restricted to authenticated administrators and the service-role client.

When uploading an image in the admin panel, Base64 data is converted to an image buffer and uploaded to `media/uploads/<timestamp>-<filename>.<ext>`. The resulting public URL is saved in the database record.

---

## 3. Remote Image Optimization (`next.config.ts`)

External and CDN image hosts are secured through Next.js `remotePatterns`:

- `upload.wikimedia.org`
- `images.unsplash.com`
- `**.googleusercontent.com`
- `avatars.githubusercontent.com` and `**.githubusercontent.com`
- `images.pexels.com`
- `kulesika.in`
- `m.media-amazon.com`, `images-na.ssl-images-amazon.com`, `images-eu.ssl-images-amazon.com`
- `covers.openlibrary.org`
- `books.google.com`
- `**.supabase.co`

Next.js `next/image` handles responsive sizing, modern image format conversion (AVIF, WebP), and cumulative layout shift prevention.

---

## 4. Orphan Asset Detection and Cleanup

The system tracks storage references to prevent unreferenced files from taking up storage:
1. `storage_files` records files uploaded to the storage bucket.
2. `getOrphanedMedia()` checks posts, notes, books, and author profiles to determine which storage paths are actively referenced in database rows.
3. Assets identified as unreferenced appear in the Orphaned Assets view in `/admin`.
4. The administrator can remove orphaned assets via `deleteOrphanedMediaAction()`.

---

## 5. Dynamic Open Graph Image Generator (`/api/og`)

Social preview images are generated dynamically at the edge using `@vercel/og` (`ImageResponse`):
- **Resolution**: 1200 × 630 pixels (standard 1.91:1 Open Graph ratio).
- **Styling**: Night background (`#141413`) with top tri-color accent strip (terracotta `#D97757`, sea-blue `#04A4BA`, sage `#788C5D`).
- **Typography**: Newsreader serif for headlines, Space Grotesk for technical metadata and branding.
- **Supported Parameters**:
  - `type`: `home`, `about`, `library`, `scribble`, `now`, `support`, `post`, `note`.
  - `slug`: Content slug to fetch post or note metadata automatically.
  - `title`: Headline text override.
  - `description`: Supporting excerpt override.
  - `persona`: Persona label.
  - `cover`: External or local cover image URL.
