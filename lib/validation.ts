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
  targetAudience: z.string().max(500),
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
  subtitle: z.string().max(500).optional(),
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
  link: z
    .string()
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: 'Link must be a valid HTTP or HTTPS URL',
    })
    .optional()
    .or(z.literal('')),
  isPublished: z.boolean().optional(),
  status: StatusField.optional(),
});

// Now Entry schema -------------------------------------------------------------

export const NowEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(500),
  date: z.string().min(1).optional(),
  slug: z.string().min(1).max(500).optional(),
  content: z.string().min(1).max(5000),
  location: z.string().max(200).optional(),
  status: StatusField.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastEditedAt: z.string().optional(),
});

// Media schema -----------------------------------------------------------------

export const MediaItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(500),
  src: z
    .string()
    .min(1)
    .refine(
      (val) =>
        (val.startsWith('/') && !val.startsWith('//') && !val.startsWith('/\\')) ||
        /^https?:\/\//i.test(val) ||
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(val),
      {
        message: 'Media src must be a relative path, HTTP/HTTPS URL, or image data URL',
      },
    ),
  alt: z.string().max(500),
  size: z.string(),
  dimensions: z.string().optional(),
  uploadedAt: z.string(),
  tags: z.array(z.string()).default([]),
  tag: z.string().optional(),
});

// Slug-only actions (delete, toggle) -------------------------------------------

export const SlugParamSchema = z.object({
  slug: SlugField,
});

// ID-only actions (delete now entry, delete media) -----------------------------

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

// Newsletter subscription schema -----------------------------------------------

export const NewsletterSubscriberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(320, 'Email is too long')
    .email('Please enter a valid email address')
    .toLowerCase(),
  source: z.string().max(100).optional(),
});
