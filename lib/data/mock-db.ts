import type {
  AdminProfile,
  BlogPost,
  BookItem,
  Entry,
  MediaItem,
  NoteItem,
  NowEntry,
  PageContent,
  SectionGroup,
  SiteContent,
  WritingItem,
} from '@/lib/types';
import {
  seedBooks,
  seedNotes,
  seedNow,
  seedPages,
  seedPosts,
  seedSiteContent,
  seedWriting,
} from './seeds';

export interface MockDatabase {
  entries: Entry[];
  site: SiteContent;
  writing: SectionGroup<WritingItem>;
  notes: SectionGroup<NoteItem>;
  books: SectionGroup<BookItem>;
  posts: BlogPost[];
  pages: PageContent[];
  now: NowEntry[];
  media: MediaItem[];
  storage: string[];
  admin: AdminProfile;
}

let db: MockDatabase | null = null;

export function getDatabase(): MockDatabase {
  if (!db) {
    db = createDatabase();
  }
  return db;
}

export function createDatabase(): MockDatabase {
  return {
    entries: seedEntries(),
    site: seedSiteContent(),
    writing: seedWriting(),
    notes: seedNotes(),
    books: seedBooks(),
    posts: seedPosts(),
    pages: seedPages(),
    now: seedNow(),
    media: seedMedia(),
    storage: seedStorage(),
    admin: seedAdmin(),
  };
}

export function resetDatabase(): MockDatabase {
  db = createDatabase();
  return db;
}

/**
 * Mock storage bucket listing — simulates the image files actually sitting in
 * the Supabase storage bucket. Includes a few files that were never registered
 * in the media library and are not referenced anywhere on the site; those are
 * the "orphaned" assets (images quietly sitting in the bucket).
 */
function seedStorage(): string[] {
  return [
    // Registered + referenced assets (known to the author).
    '/biranchi.jpeg',
    '/selfiewithmiku.jpeg',
    '/selfiewithblessie.jpeg',
    '/selfiewithfriends.jpeg',
    '/selfiewithbhabani.jpeg',
    '/groupphotowithfriends.jpeg',
    '/melayingonsciencemuseum.jpeg',
    // Book covers (external).
    'https://upload.wikimedia.org/wikipedia/en/5/5a/Thinking_in_Systems_cover.jpg',
    'https://upload.wikimedia.org/wikipedia/en/6/6d/Technopoly_cover.jpg',
    // Unknown files quietly sitting in the bucket — orphaned.
    '/IMG_20240512_184302.jpeg',
    '/DSC_0217.png',
    '/old-header-banner.webp',
  ];
}

function seedAdmin(): AdminProfile {
  return {
    name: 'Biranchi Kulesika',
    email: 'hello@biranchi.com',
    avatarUrl: '/biranchi.jpeg',
    role: 'Owner & Author',
    authStatus: 'developer_mode',
    lastLogin: new Date().toISOString(),
  };
}

function seedMedia(): MediaItem[] {
  return [
    {
      id: 'media-001',
      name: 'biranchi.jpeg',
      src: '/biranchi.jpeg',
      alt: 'Biranchi Kulesika Portrait',
      size: '210 KB',
      dimensions: '900 × 1600',
      uploadedAt: '2026-08-19',
      tag: 'profile',
    },
    {
      id: 'media-002',
      name: 'selfiewithmiku.jpeg',
      src: '/selfiewithmiku.jpeg',
      alt: 'Selfie with Miku',
      size: '240 KB',
      dimensions: '900 × 1600',
      uploadedAt: '2026-08-19',
      tag: 'atmosphere',
    },
    {
      id: 'media-003',
      name: 'selfiewithblessie.jpeg',
      src: '/selfiewithblessie.jpeg',
      alt: 'Selfie with Blessie',
      size: '235 KB',
      dimensions: '900 × 1600',
      uploadedAt: '2026-08-19',
      tag: 'atmosphere',
    },
    {
      id: 'media-004',
      name: 'selfiewithfriends.jpeg',
      src: '/selfiewithfriends.jpeg',
      alt: 'Selfie with Friends',
      size: '180 KB',
      dimensions: '581 × 1032',
      uploadedAt: '2026-08-19',
      tag: 'atmosphere',
    },
    {
      id: 'media-005',
      name: 'selfiewithbhabani.jpeg',
      src: '/selfiewithbhabani.jpeg',
      alt: 'Selfie with Bhabani',
      size: '250 KB',
      dimensions: '900 × 1600',
      uploadedAt: '2026-08-19',
      tag: 'atmosphere',
    },
    {
      id: 'media-006',
      name: 'groupphotowithfriends.jpeg',
      src: '/groupphotowithfriends.jpeg',
      alt: 'Group photo with friends',
      size: '310 KB',
      dimensions: '1600 × 900',
      uploadedAt: '2026-08-19',
      tag: 'atmosphere',
    },
    {
      id: 'media-007',
      name: 'melayingonsciencemuseum.jpeg',
      src: '/melayingonsciencemuseum.jpeg',
      alt: 'Laying on grass at Science Museum',
      size: '290 KB',
      dimensions: '1600 × 900',
      uploadedAt: '2026-08-19',
      tag: 'atmosphere',
    },
    {
      id: 'media-008',
      name: 'thinking-in-systems-cover.jpg',
      src: 'https://upload.wikimedia.org/wikipedia/en/5/5a/Thinking_in_Systems_cover.jpg',
      alt: 'Thinking in Systems book cover',
      size: '38 KB',
      dimensions: '256 × 402',
      uploadedAt: '2026-08-19',
      tag: 'book',
    },
    {
      id: 'media-009',
      name: 'technopoly-cover.jpg',
      src: 'https://upload.wikimedia.org/wikipedia/en/6/6d/Technopoly_cover.jpg',
      alt: 'Technopoly book cover',
      size: '42 KB',
      dimensions: '256 × 402',
      uploadedAt: '2026-08-19',
      tag: 'book',
    },
  ];
}

function seedEntries(): Entry[] {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: '1',
      slug: 'hello',
      title: 'Hello, new world',
      body: 'This is placeholder content from the mock database. The real requirements are still being defined.',
      publishedAt: new Date(now.getTime() - 7 * day).toISOString(),
    },
    {
      id: '2',
      slug: 'foundation',
      title: 'Laying the foundation',
      body: 'UI talks to a service layer, which talks to a repository, which reads from a mock database.',
      publishedAt: new Date(now.getTime() - 3 * day).toISOString(),
    },
    {
      id: '3',
      slug: 'next-steps',
      title: 'Next steps are unclear — intentionally',
      body: 'We will decide what this website should be progressively. Nothing is locked in.',
      publishedAt: new Date(now.getTime() - 1 * day).toISOString(),
    },
  ];
}