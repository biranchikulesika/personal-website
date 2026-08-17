import { z } from 'zod';

export const postBaseSchema = z.object({
  id: z.string().optional(),
  persona: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  byline: z.string().nullable().optional(),
  slug: z.string(),
  oldSlugs: z.array(z.string()).nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  excerpt: z.string().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  coverImageAlt: z.string().nullable().optional(),
  coverImageCaption: z.string().nullable().optional(),
  coverImageLocation: z.string().nullable().optional(),
  coverImageCredit: z.string().nullable().optional(),
  autoCoverImage: z.boolean().optional(),
  content: z.string().nullable().optional(),
  draftContent: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  readingTime: z.number().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
  autoOptimize: z.boolean().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogTitle: z.string().nullable().optional(),
  ogDescription: z.string().nullable().optional(),
  twitterTitle: z.string().nullable().optional(),
  twitterDescription: z.string().nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  manualOverrides: z.array(z.string()).nullable().optional(),
  aiMetadataStatus: z.enum(['idle', 'generating', 'completed', 'failed']).nullable().optional(),
  aiMetadataLastGeneratedAt: z.string().nullable().optional(),
  aiMetadataContentHash: z.string().nullable().optional(),
  aiMetadataError: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const updatePostSchema = postBaseSchema.partial();

export const postSchema = postBaseSchema.superRefine((data, ctx) => {
  if (data.status === 'published') {
    if (!data.title || data.title.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Title is required for published posts", path: ["title"] });
    }
    if (!data.slug || data.slug.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Slug is required for published posts", path: ["slug"] });
    }
    if (!data.content || data.content.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Content is required for published posts", path: ["content"] });
    }
    if (!data.persona || data.persona.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Persona is required for published posts", path: ["persona"] });
    }
  }
});

export const fieldNoteSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  excerpt: z.string().optional(),
  content: z.string(),
  category: z.string(),
  publishedAt: z.string().optional(),
  featured: z.boolean(),
  hidden: z.boolean(),
  draft: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  question: z.string().optional(),
  context: z.string().optional(),
  order: z.number(),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const thoughtFragmentSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  publishedAt: z.string().optional(),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const journalMomentSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  body: z.string(),
  timeLabel: z.string(),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const fragmentSchema = z.object({
  id: z.string().optional(),
  quote: z.string(),
  source: z.string(),
  title: z.string().optional(),
  body: z.string().optional(),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const bookSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  author: z.string(),
  coverImage: z.string().optional(),
  category: z.string(),
  status: z.enum(['reading', 'finished', 'paused', 'wishlist']),
  notes: z.string().optional(),
  featured: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const builderStatusSchema = z.object({
  id: z.string().optional(),
  operationalState: z.string(),
  statusText: z.string(),
  currentFocus: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const activeSystemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  stack: z.array(z.string()),
  updatedAt: z.string().optional(),
  order: z.number(),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
});

export const buildLogSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  source: z.enum(['manual', 'automated']),
  aiGenerated: z.boolean(),
  generatedAt: z.string().optional(),
  generationModel: z.string().optional(),
  relatedCommits: z.array(z.string()),
  relatedRepositories: z.array(z.string()),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const operatorFocusSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  value: z.string(),
  order: z.number(),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const redistributionRecordSchema = z.object({
  id: z.string().optional(),
  amount: z.number(),
  destination: z.string(),
  description: z.string(),
  proofUrl: z.string().optional(),
  internalNotes: z.string().nullable().optional(),
  donatedAt: z.string(),
  transactionReference: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const newsletterIssueSchema = z.object({
  id: z.string().optional(),
  persona: z.string(),
  title: z.string(),
  subject: z.string().optional(),
  previewText: z.string().optional(),
  content: z.string(),
  publishedAt: z.string().optional(),
  hidden: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const newsletterProfileSchema = z.object({
  id: z.string().optional(),
  persona: z.string(),
  description: z.string(),
  frequencyText: z.string(),
  philosophyText: z.string(),
  expectationItems: z.array(z.string()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const subscriberSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  source: z.string().optional(),
  isVerified: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const subscriptionSchema = z.object({
  id: z.string().optional(),
  subscriberId: z.string(),
  persona: z.string(),
  active: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const donationSchema = z.object({
  id: z.string().optional(),
  amount: z.number(),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional().or(z.literal('')),
  donorPhone: z.string().optional(),
  publicName: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  status: z.string().default('pending'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const passkeyCredentialSchema = z.object({
  id: z.string().optional(),
  userId: z.string().uuid(),
  credentialId: z.string().min(1),
  publicKey: z.string().min(1),
  counter: z.number().int().nonnegative().default(0),
  deviceType: z.enum(['singleDevice', 'multiDevice']).default('singleDevice'),
  backedUp: z.boolean().default(false),
  transports: z.array(z.string()).default([]),
  name: z.string().min(1).max(100).default('Passkey'),
  aaguid: z.string().nullable().optional(),
  lastUsedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const passkeyRenameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Name cannot be empty').max(50, 'Name must be 50 characters or less'),
});

