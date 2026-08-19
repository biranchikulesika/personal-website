import type {
  AdminProfile,
  BlogPost,
  BookItem,
  Entry,
  MediaItem,
  NoteItem,
  PageContent,
  SectionGroup,
  SiteContent,
  WritingItem,
} from '@/lib/types';
import {
  seedBooks,
  seedNotes,
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
  media: MediaItem[];
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
    media: seedMedia(),
    admin: seedAdmin(),
  };
}

export function resetDatabase(): MockDatabase {
  db = createDatabase();
  return db;
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