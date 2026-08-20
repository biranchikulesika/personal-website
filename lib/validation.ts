import { z } from 'zod';

// Shared primitives ------------------------------------------------------------

const PersonaEnum = z.enum(['builder', 'operator', 'thinker', 'wanderer']);

const SlugField = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case');

const StatusField = z.enum(['published', 'unpublished']);

// Blog Post schema ------------------------------------------------------------

const PostSectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1),
  paragraphs: z.array(z.string()),
  figure: z
    .object({
      src: z.string(),
      alt: z.string(),
      caption: z.string(),
    })
    .optional(),
  quote: z
    .object({
      text: z.string(),
      attribution: z.string().optional(),
    })
    .optional(),
  footnotes: z.array(z.string()).optional(),
});

const BookCardSchema = z.object({
  title: z.string(),
  author: z.string(),
  note: z.string(),
});

export const BlogPostSchema = z.object({
  slug: SlugField,
  title: z.string().min(1, 'Title is required').max(500),
  subtitle: z.string().max(500).optional(),
  description: z.string().min(1).max(1000),
  persona: PersonaEnum.optional(),
  tags: z.array(z.string()).max(20),
  publishedAt: z.string().min(1),
  lastEditedAt: z.string().min(1),
  assumedAudience: z.string().max(500),
  intro: z.array(z.string()),
  sections: z.array(PostSectionSchema),
  books: z.array(BookCardSchema),
  coverImage: z.string().optional(),
  status: StatusField.optional(),
});

// Note schema ------------------------------------------------------------------

export const NoteItemSchema = z.object({
  id: z.string().min(1),
  slug: SlugField,
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().min(1).max(1000),
  content: z.array(z.string()),
  date: z.string().min(1),
  persona: PersonaEnum,
  tags: z.array(z.string()).max(20),
  coverImage: z.string().optional(),
  status: StatusField.optional(),
});

// Book schema ------------------------------------------------------------------

export const BookItemSchema = z.object({
  id: z.string().min(1),
  slug: SlugField,
  title: z.string().min(1, 'Title is required').max(500),
  author: z.string().min(1, 'Author is required').max(300),
  description: z.string().max(2000),
  date: z.string().min(1),
  persona: PersonaEnum,
  tags: z.array(z.string()).max(20),
  cover: z.string().optional(),
  link: z.string().url().optional().or(z.literal('')),
});

// Now Entry schema -------------------------------------------------------------

export const NowEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(500),
  date: z.string().min(1),
  content: z.string().min(1).max(5000),
});

// Media schema -----------------------------------------------------------------

export const MediaItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(500),
  src: z.string().min(1),
  alt: z.string().max(500),
  size: z.string(),
  dimensions: z.string().optional(),
  uploadedAt: z.string(),
  tag: z.enum(['profile', 'atmosphere', 'post', 'book']),
});

// Admin Profile schema — restricts which fields can be updated -----------------

export const AdminProfileUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
  role: z.string().max(200).optional(),
  // authStatus is intentionally excluded — it must not be modified via the update action.
});

// Slug-only actions (delete, toggle) -------------------------------------------

export const SlugParamSchema = z.object({
  slug: SlugField,
});

// ID-only actions (delete now entry, delete media) -----------------------------

export const IdParamSchema = z.object({
  id: z.string().min(1),
});
