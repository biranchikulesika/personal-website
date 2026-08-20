// Mock database — minimal, used only for tests.
// All content (posts, notes, books, now entries) lives in the live database.

import type {
  AppRole,
  UserRole,
  MediaItem,
} from "@/lib/types";

export interface MockDatabase {
  media: MediaItem[];
  storage: string[];
  userRoles: UserRole[];
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
    media: seedMedia(),
    storage: seedStorage(),
    userRoles: [],
  };
}

export function resetDatabase(): MockDatabase {
  db = createDatabase();
  return db;
}

function seedStorage(): string[] {
  return [
    "/biranchi.jpeg",
    "/selfiewithmiku.jpeg",
    "/selfiewithblessie.jpeg",
    "/selfiewithfriends.jpeg",
    "/selfiewithbhabani.jpeg",
    "/groupphotowithfriends.jpeg",
    "/melayingonsciencemuseum.jpeg",
    "https://upload.wikimedia.org/wikipedia/en/5/5a/Thinking_in_Systems_cover.jpg",
    "https://upload.wikimedia.org/wikipedia/en/6/6d/Technopoly_cover.jpg",
    "/IMG_20240512_184302.jpeg",
    "/DSC_0217.png",
    "/old-header-banner.webp",
    "/testing.webp",
  ];
}

function seedMedia(): MediaItem[] {
  return [
    {
      id: "media-001",
      name: "biranchi.jpeg",
      src: "/biranchi.jpeg",
      alt: "Biranchi Kulesika Portrait",
      size: "210 KB",
      dimensions: "900 × 1600",
      uploadedAt: "2026-08-19",
      tag: "profile",
    },
    {
      id: "media-002",
      name: "selfiewithmiku.jpeg",
      src: "/selfiewithmiku.jpeg",
      alt: "Selfie with Miku",
      size: "240 KB",
      dimensions: "900 × 1600",
      uploadedAt: "2026-08-19",
      tag: "atmosphere",
    },
    {
      id: "media-003",
      name: "selfiewithblessie.jpeg",
      src: "/selfiewithblessie.jpeg",
      alt: "Selfie with Blessie",
      size: "235 KB",
      dimensions: "900 × 1600",
      uploadedAt: "2026-08-19",
      tag: "atmosphere",
    },
    {
      id: "media-004",
      name: "selfiewithfriends.jpeg",
      src: "/selfiewithfriends.jpeg",
      alt: "Selfie with Friends",
      size: "180 KB",
      dimensions: "581 × 1032",
      uploadedAt: "2026-08-19",
      tag: "atmosphere",
    },
    {
      id: "media-005",
      name: "selfiewithbhabani.jpeg",
      src: "/selfiewithbhabani.jpeg",
      alt: "Selfie with Bhabani",
      size: "250 KB",
      dimensions: "900 × 1600",
      uploadedAt: "2026-08-19",
      tag: "atmosphere",
    },
    {
      id: "media-006",
      name: "groupphotowithfriends.jpeg",
      src: "/groupphotowithfriends.jpeg",
      alt: "Group photo with friends",
      size: "310 KB",
      dimensions: "1600 × 900",
      uploadedAt: "2026-08-19",
      tag: "atmosphere",
    },
    {
      id: "media-007",
      name: "melayingonsciencemuseum.jpeg",
      src: "/melayingonsciencemuseum.jpeg",
      alt: "Laying on grass at Science Museum",
      size: "290 KB",
      dimensions: "1600 × 900",
      uploadedAt: "2026-08-19",
      tag: "atmosphere",
    },
    {
      id: "media-008",
      name: "thinking-in-systems-cover.jpg",
      src: "https://upload.wikimedia.org/wikipedia/en/5/5a/Thinking_in_Systems_cover.jpg",
      alt: "Thinking in Systems book cover",
      size: "38 KB",
      dimensions: "256 × 402",
      uploadedAt: "2026-08-19",
      tag: "book",
    },
    {
      id: "media-009",
      name: "technopoly-cover.jpg",
      src: "https://upload.wikimedia.org/wikipedia/en/6/6d/Technopoly_cover.jpg",
      alt: "Technopoly book cover",
      size: "42 KB",
      dimensions: "256 × 402",
      uploadedAt: "2026-08-19",
      tag: "book",
    },
    {
      id: "media-010",
      name: "testing.webp",
      src: "/testing.webp",
      alt: "Cover artwork — transparent WebP test asset",
      size: "14 KB",
      dimensions: "399 × 399",
      uploadedAt: "2026-08-20",
      tag: "post",
    },
  ];
}
