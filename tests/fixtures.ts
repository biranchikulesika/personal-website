import { SITE_URL } from "../lib/constants";
import type {
  BlogPost,
  NoteItem,
  BookItem,
  NowEntry,
  MediaItem,
  Persona,
} from "../lib/types";

/** Counter for generating unique slugs across tests. */
let slugCounter = 0;

/**
 * Create a test blog post with sensible defaults.
 * Override any field as needed.
 */
export function createTestPost(
  overrides: Partial<BlogPost> = {},
): BlogPost {
  slugCounter++;
  return {
    slug: `test-post-${slugCounter}`,
    title: `Test Post ${slugCounter}`,
    description: `Description for test post ${slugCounter}`,
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    targetAudience: "Test audience",
    intro: ["This is the intro paragraph."],
    sections: [
      {
        id: "section-1",
        heading: "Test Section",
        paragraphs: ["This is the section body."],
      },
    ],
    books: [],
    ...overrides,
  };
}

/**
 * Create a test note with sensible defaults.
 */
export function createTestNote(
  overrides: Partial<NoteItem> = {},
): NoteItem {
  slugCounter++;
  return {
    id: `note-${slugCounter}`,
    slug: `test-note-${slugCounter}`,
    title: `Test Note ${slugCounter}`,
    description: `Description for test note ${slugCounter}`,
    content: ["This is the note body."],
    date: "2026-08-20",
    persona: "thinker",
    tags: ["test"],
    ...overrides,
  };
}

/**
 * Create a test book with sensible defaults.
 */
export function createTestBook(
  overrides: Partial<BookItem> = {},
): BookItem {
  slugCounter++;
  return {
    id: `book-${slugCounter}`,
    slug: `test-book-${slugCounter}`,
    title: `Test Book ${slugCounter}`,
    author: `Test Author ${slugCounter}`,
    description: `Description for test book ${slugCounter}`,
    date: "2026",
    persona: "thinker",
    tags: ["reading"],
    ...overrides,
  };
}

/**
 * Create a test now entry with sensible defaults.
 */
export function createTestNowEntry(
  overrides: Partial<NowEntry> = {},
): NowEntry {
  slugCounter++;
  return {
    id: `now-${slugCounter}`,
    title: `Now Entry ${slugCounter}`,
    date: "2026-08",
    content: `Currently focused on test entry ${slugCounter}.`,
    ...overrides,
  };
}

/**
 * Create a test media item with sensible defaults.
 */
export function createTestMedia(
  overrides: Partial<MediaItem> = {},
): MediaItem {
  slugCounter++;
  return {
    id: `media-${slugCounter}`,
    name: `test-image-${slugCounter}.jpeg`,
    src: `/test-image-${slugCounter}.jpeg`,
    alt: `Test image ${slugCounter}`,
    size: "100 KB",
    uploadedAt: "2026-08-20",
    tag: "",
    tags: [],
    ...overrides,
  };
}

/** All persona values for iteration in tests. */
export const ALL_PERSONAS: Persona[] = [
  "builder",
  "operator",
  "thinker",
  "wanderer",
];

/** Canonical production domain used in tests. */
export const TEST_DOMAIN = SITE_URL;
