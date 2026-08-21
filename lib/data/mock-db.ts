// Mock database — minimal, used only for tests.
// All content (posts, notes, books, now entries) lives in the live database.

import type {
  AppRole,
  UserRole,
  MediaItem,
  Contribution,
  PasskeyItem,
  UserSession,
} from "@/lib/types";

export interface MockDatabase {
  media: MediaItem[];
  storage: string[];
  userRoles: UserRole[];
  contributions: Contribution[];
  passkeys: PasskeyItem[];
  sessions: UserSession[];
  connectedProviders: Record<string, string[]>;
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
    contributions: [],
    passkeys: seedPasskeys(),
    sessions: seedSessions(),
    connectedProviders: {
      default: ["google"],
    },
  };
}

export function resetDatabase(): MockDatabase {
  db = createDatabase();
  return db;
}

function seedPasskeys(): PasskeyItem[] {
  return [
    {
      id: "pk-1",
      label: "Linux Computer",
      createdAt: "2026-08-14T12:00:00.000Z",
      lastUsedAt: "Aug 14, 2026",
      credentialId: "cred-linux-fido2",
    },
  ];
}

function seedSessions(): UserSession[] {
  return [
    {
      id: "sess-current",
      userId: "default",
      device: "Linux Computer / Chrome",
      location: "127.0.0.1 (Local)",
      ipAddress: "127.0.0.1",
      startedAt: "Just now",
      lastActiveAt: new Date().toISOString(),
      isCurrent: true,
    },
  ];
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
    "/IMG_20240512_184302.jpeg",
    "/DSC_0217.png",
    "/old-header-banner.webp",
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
  ];
}
