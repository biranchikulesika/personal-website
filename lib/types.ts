export interface Post {
  id: string;
  persona: string;
  title: string;
  subtitle?: string;
  byline?: string;
  slug: string;
  oldSlugs?: string[];
  status?: 'draft' | 'published' | 'archived';
  excerpt?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  coverImageLocation?: string;
  coverImageCredit?: string;
  autoCoverImage: boolean;
  content: string;
  draftContent?: string;
  tags: string[];
  readingTime?: number;
  publishedAt?: string;
  featured: boolean;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldNote {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  publishedAt?: string;
  featured: boolean;
  hidden: boolean;
  draft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  question?: string;
  context?: string;
  order: number;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThoughtFragment {
  id: string;
  text: string;
  title?: string;
  content?: string;
  publishedAt?: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalMoment {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Fragment {
  id: string;
  quote: string;
  source: string;
  title?: string;
  body?: string;
  hidden: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  category: string;
  status: 'reading' | 'finished' | 'paused' | 'wishlist';
  notes?: string;
  featured: boolean;
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderStatus {
  id: string;
  operationalState: string;
  statusText: string;
  currentFocus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSystem {
  id: string;
  title: string;
  description: string;
  status: string;
  stack: string[];
  updatedAt: string;
  order: number;
  hidden: boolean;
  createdAt: string;
}

export interface BuildLog {
  id: string;
  title: string;
  category?: string;
  shortSummary?: string;
  longSummary?: string;
  description?: string;
  date: string;
  source: 'manual' | 'automated';
  aiGenerated: boolean;
  generatedAt?: string;
  generationModel?: string;
  relatedCommits: string[];
  relatedRepositories: string[];
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorFocus {
  id: string;
  label: string;
  value: string;
  description?: string;
  order: number;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RedistributionRecord {
  id: string;
  amount: number;
  destination: string;
  description: string;
  proofUrl?: string;
  internalNotes?: string | null;
  donatedAt: string;
  transactionReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterIssue {
  id: string;
  persona: string;
  title: string;
  subject?: string;
  previewText?: string;
  content: string;
  publishedAt?: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterProfile {
  id: string;
  persona: string;
  description: string;
  frequencyText: string;
  philosophyText: string;
  expectationItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  source?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  subscriberId: string;
  persona: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  amount: number;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  publicName?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
