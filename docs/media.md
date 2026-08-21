# Media & Storage

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
  tag: 'profile' | 'atmosphere' | 'post' | 'book';
}
```

### Media Tags:
- **`profile`**: Author portraits, avatar photos.
- **`atmosphere`**: Candid photographs, background ambiance.
- **`post`**: Figures, diagram illustrations, and article headers.
- **`book`**: Book cover scans and jacket artwork.

---

## 2. Storage Buckets & Policies

Assets are stored in Supabase Storage under the `media` bucket:
- **Bucket ID**: `media`
- **Visibility**: Public (`public: true`)
- **Max File Size**: 50 MB
- **Allowed Formats**: JPEG, PNG, WebP, GIF, SVG, PDF

### Security Policies:
- Public anonymous users can read and load objects via public CDN URLs.
- Only authenticated admins and the service-role client can upload, overwrite, or delete objects.

---

## 3. Image Optimization (`next.config.ts`)

External and CDN image hosts are secured through Next.js `remotePatterns`:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'upload.wikimedia.org' },
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
  ],
}
```

All UI images utilize `next/image` for responsive resizing, modern format conversion (AVIF/WebP), and layout shift prevention.

---

## 4. Orphan Asset Detection & Cleanup

The system tracks storage references to ensure old or unreferenced files do not waste bucket space:
1. `storage_files` tracks raw files uploaded to the bucket.
2. `getOrphanedMedia()` scans posts, notes, books, and author profiles to determine which storage assets are actively referenced in database rows.
3. Assets identified as unreferenced appear in the **Orphaned Assets** tab in `/admin`, allowing the admin to reclaim space with a single click via `deleteStorageAssetsAction()`.

---

## 5. Dynamic Open Graph Image Generator (`/api/og`)

Social preview images are generated on the fly via the `/api/og` endpoint:
- **Parameters**: `slug`, `title`, `description`, `type`, `persona`, `cover`.
- **Behavior**:
  - If a `slug` is supplied, it resolves post metadata and renders a customized SVG / Canvas card featuring the post title, reading time, publication date, and persona badge.
  - Generates crisp `1200 × 630` social media banner cards compatible with Twitter/X, Discord, Slack, and LinkedIn.
