import { cache } from 'react';
import type {
  AppRole,
  UserRole,
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
  ScribbleEntry,
  HomeContent,
  SectionGroup,
  WritingItem,
  Contribution,
  PasskeyItem,
  PasskeyCredentialRecord,
  UserSession,
  NewsletterSubscriber,
} from '@/lib/types';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  parseRazorpayWebhookEvent,
  getRazorpayOrder,
  extractWebhookEventId,
} from '@/lib/razorpay';
import { getContentRepository } from '@/lib/repositories';
import type { ContentRepository } from '@/lib/repositories/content.repository';

// ── Per-Request Memoization ────────────────────────────────────────────────
// React.cache deduplicates identical read queries across Server Components and
// generateMetadata in the same render pass, avoiding duplicate DB roundtrips.

const getCachedPost = cache((repo: ContentRepository, slug: string) => repo.getPost(slug));
const getCachedNote = cache((repo: ContentRepository, slug: string) => repo.getNote(slug));
const getCachedHomeContent = cache((repo: ContentRepository) => repo.getHomeContent());
const getCachedWriting = cache((repo: ContentRepository) => repo.getWriting());
const getCachedLibrary = cache((repo: ContentRepository) => repo.getLibrary());
const getCachedScribble = cache((repo: ContentRepository) => repo.getScribbleEntries());
const getCachedNow = cache((repo: ContentRepository) => repo.getNowEntries());
const getCachedAllPosts = cache((repo: ContentRepository) => repo.getAllPosts());
const getCachedAllNotes = cache((repo: ContentRepository) => repo.getAllNotes());
const getCachedAllBooks = cache((repo: ContentRepository) => repo.getAllBooks());

// Application layer for site content. Components and pages interact with content
// via intent methods (getHomeContent, getWriting, ...).

export class ContentService {
  constructor(private repo: ContentRepository = getContentRepository()) {}

  getHomeContent(): Promise<HomeContent> {
    return getCachedHomeContent(this.repo);
  }

  getWriting(): Promise<SectionGroup<WritingItem>> {
    return getCachedWriting(this.repo);
  }

  getLibrary(): Promise<SectionGroup<BookItem>> {
    return getCachedLibrary(this.repo);
  }

  getPost(slug: string): Promise<BlogPost | null> {
    return getCachedPost(this.repo, slug);
  }

  getPostSlugs(): Promise<string[]> {
    return this.repo.getPostSlugs();
  }

  getAllPosts(): Promise<BlogPost[]> {
    return getCachedAllPosts(this.repo);
  }

  async savePost(post: BlogPost, persona?: Persona): Promise<BlogPost> {
    return this.repo.savePost(await this.stampPublishDate(post), persona);
  }

  deletePost(slug: string): Promise<boolean> {
    return this.repo.deletePost(slug);
  }

  async togglePostStatus(slug: string): Promise<BlogPost | null> {
    const post = await this.repo.getPost(slug);
    if (!post) return null;
    const status = post.status === "unpublished" ? "published" : "unpublished";
    return this.savePost({ ...post, status }, post.persona);
  }

  // Drafts are saved with the day they were created, so publishing has to stamp
  // the real publish date. A date the author changed in the editor is kept.
  private async stampPublishDate(post: BlogPost): Promise<BlogPost> {
    if ((post.status ?? "published") !== "published") return post;
    const existing = await this.repo.getPost(post.slug);
    if (
      existing?.status === "unpublished" &&
      post.publishedAt === existing.publishedAt
    ) {
      return { ...post, publishedAt: new Date().toISOString().split("T")[0] };
    }
    return post;
  }

  getNote(slug: string): Promise<NoteItem | null> {
    return getCachedNote(this.repo, slug);
  }

  getNoteSlugs(): Promise<string[]> {
    return this.repo.getNoteSlugs();
  }

  getAllNotes(): Promise<NoteItem[]> {
    return getCachedAllNotes(this.repo);
  }

  saveNote(note: NoteItem): Promise<NoteItem> {
    return this.repo.saveNote(note);
  }

  deleteNote(slug: string): Promise<boolean> {
    return this.repo.deleteNote(slug);
  }

  toggleNoteStatus(slug: string): Promise<NoteItem | null> {
    return this.repo.toggleNoteStatus(slug);
  }

  getAllBooks(): Promise<BookItem[]> {
    return getCachedAllBooks(this.repo);
  }

  saveBook(book: BookItem): Promise<BookItem> {
    return this.repo.saveBook(book);
  }

  deleteBook(slug: string): Promise<boolean> {
    return this.repo.deleteBook(slug);
  }

  toggleBookStatus(slug: string): Promise<BookItem | null> {
    return this.repo.toggleBookStatus(slug);
  }

  getNowEntries(): Promise<NowEntry[]> {
    return getCachedNow(this.repo);
  }

  saveNowEntry(entry: NowEntry): Promise<NowEntry> {
    return this.repo.saveNowEntry(entry);
  }

  deleteNowEntry(id: string): Promise<boolean> {
    return this.repo.deleteNowEntry(id);
  }

  getScribbleEntries(): Promise<ScribbleEntry[]> {
    return getCachedScribble(this.repo);
  }

  getMedia(): Promise<MediaItem[]> {
    return this.repo.getMedia();
  }

  addMedia(item: MediaItem): Promise<MediaItem> {
    return this.repo.addMedia(item);
  }

  deleteMedia(id: string): Promise<boolean> {
    return this.repo.deleteMedia(id);
  }

  getOrphanedMedia(): Promise<MediaItem[]> {
    return this.repo.getOrphanedMedia();
  }

  deleteStorageAssets(srcs: string[]): Promise<number> {
    return this.repo.deleteStorageAssets(srcs);
  }

  getUserRole(userId: string): Promise<AppRole | null> {
    return this.repo.getUserRole(userId);
  }

  setUserRole(userId: string, role: AppRole): Promise<void> {
    return this.repo.setUserRole(userId, role);
  }

  getAllUserRoles(): Promise<UserRole[]> {
    return this.repo.getAllUserRoles();
  }

  getFeaturedPosts(): Promise<string[]> {
    return this.repo.getFeaturedPosts();
  }

  getFeaturedBooks(): Promise<string[]> {
    return this.repo.getFeaturedBooks();
  }

  setFeaturedPosts(slugs: string[]): Promise<void> {
    return this.repo.setFeaturedPosts(slugs);
  }

  setFeaturedBooks(slugs: string[]): Promise<void> {
    return this.repo.setFeaturedBooks(slugs);
  }

  // ── Contributions & Patronage ───────────────────────────────────────────

  getContribution(id: string): Promise<Contribution | null> {
    return this.repo.getContribution(id);
  }

  getContributions(): Promise<Contribution[]> {
    return this.repo.getContributions();
  }

  recordContribution(contribution: Contribution): Promise<Contribution> {
    return this.repo.recordContribution(contribution);
  }

  /**
   * Idempotently confirm a payment (from client checkout or server callback)
   * and store the contribution record in the database.
   */
  async confirmPayment(params: {
    paymentId: string;
    orderId?: string;
    signature?: string;
    amount: number;
    name?: string;
    email?: string;
    note?: string;
    source?: Contribution['source'];
  }): Promise<Contribution> {
    const {
      paymentId,
      orderId,
      signature,
      amount,
      name = 'Anonymous Patron',
      email,
      note,
      source = 'razorpay',
    } = params;

    if (!paymentId || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid payment parameters: paymentId and positive amount are required');
    }

    // A client callback never overwrites a payment already confirmed by a
    // signed webhook.
    const existing = await this.repo.getContribution(paymentId);
    if (existing?.status === 'captured') return existing;

    let verifiedAmount = amount;
    if (source === 'razorpay') {
      if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Payment verification is not configured on server');
      }
      if (!orderId || !signature) {
        throw new Error('orderId and signature are required for Razorpay payment verification');
      }

      const isValid = verifyPaymentSignature({
        orderId,
        paymentId,
        signature,
      });

      if (!isValid) {
        throw new Error('Invalid Razorpay payment signature');
      }

      // The client signature only binds order_id|payment_id. Fetch the order
      // server-side so the client cannot set the recorded amount.
      const order = await getRazorpayOrder(orderId);
      if (order.currency !== 'INR') {
        throw new Error('Unexpected payment currency');
      }
      verifiedAmount = order.amount / 100;
    }

    const contribution: Contribution = {
      id: paymentId,
      orderId,
      paymentId,
      amount: verifiedAmount,
      currency: 'INR',
      // Only the signed webhook can mark a Razorpay payment as captured; the
      // amount in this client callback is not authoritative.
      status: source === 'razorpay' ? 'pending' : 'captured',
      name: name.trim() || 'Anonymous Patron',
      email: email?.trim(),
      note: note?.trim(),
      createdAt: new Date().toISOString(),
      source,
    };

    return this.repo.recordContribution(contribution);
  }

  /**
   * Process Razorpay webhook event with signature verification and idempotent recording.
   * Strictly fails closed if the webhook secret is missing or signature is invalid.
   */
  async processRazorpayWebhook(
    rawBody: string,
    signature: string,
  ): Promise<{
    success: boolean;
    event?: string;
    contribution?: Contribution | null;
    error?: string;
  }> {
    // 1. Webhook secret MUST be configured (fail closed)
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return {
        success: false,
        error: 'Razorpay webhook secret is not configured on server',
      };
    }

    // 2. Signature header MUST be provided
    if (!signature) {
      return {
        success: false,
        error: 'Missing webhook signature header',
      };
    }

    // 3. Verify webhook signature
    const isValid = verifyWebhookSignature({
      rawBody,
      signature,
      secret,
    });

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid webhook signature',
      };
    }

    // 4. Parse payload JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return {
        success: false,
        error: 'Invalid JSON payload',
      };
    }

    // 5. Extract event & contribution details
    const { event, contribution } = parseRazorpayWebhookEvent(parsed);

    // 6. Replay protection: a signed event id is applied at most once. If the
    // provider omits an id, fall back to applying the normal state guards.
    const eventId = extractWebhookEventId(parsed);
    if (eventId && (await this.repo.hasWebhookEvent(eventId))) {
      return { success: true, event, contribution: null };
    }

    // 7. Idempotently record contribution if valid.
    let resultContribution: Contribution | null = null;
    if (contribution) {
      const existing = await this.repo.getContribution(contribution.id);
      // Terminal states win: a delayed/retried `payment.authorized` or
      // `payment.failed` must never downgrade `captured`, and neither may
      // overwrite `refunded`/`cancelled`.
      const isDowngrade =
        existing?.status === 'captured' &&
        ['pending', 'failed'].includes(contribution.status);
      const alreadyFinal =
        existing && ['refunded', 'cancelled'].includes(existing.status);
      resultContribution =
        isDowngrade || (alreadyFinal && existing.status !== contribution.status)
          ? existing
          : await this.repo.recordContribution(contribution);
    }

    // Mark processed only after the state change succeeds, so a failed write
    // is still retried by Razorpay.
    if (eventId) {
      await this.repo.recordWebhookEvent(eventId, event || 'unknown');
    }

    return { success: true, event, contribution: resultContribution };
  }

  // ── Passkeys & Auth ─────────────────────────────────────────────────────

  getPasskeys(userId: string): Promise<PasskeyItem[]> {
    return this.repo.getPasskeys(userId);
  }

  savePasskey(userId: string, passkey: PasskeyItem): Promise<PasskeyItem> {
    return this.repo.savePasskey(userId, passkey);
  }

  deletePasskey(userId: string, passkeyId: string): Promise<boolean> {
    return this.repo.deletePasskey(userId, passkeyId);
  }

  findPasskeyCredential(credentialId: string): Promise<PasskeyCredentialRecord | null> {
    return this.repo.findPasskeyCredential(credentialId);
  }

  getAllAdminPasskeys(): Promise<PasskeyItem[]> {
    return this.repo.getAllAdminPasskeys();
  }

  // ── Active Sessions ─────────────────────────────────────────────────────

  getSessions(userId: string, currentSessionId?: string): Promise<UserSession[]> {
    return this.repo.getSessions(userId, currentSessionId);
  }

  recordSession(session: UserSession): Promise<UserSession> {
    return this.repo.recordSession(session);
  }

  deleteSession(userId: string, sessionId: string): Promise<boolean> {
    return this.repo.deleteSession(userId, sessionId);
  }

  deleteAllSessions(userId: string): Promise<boolean> {
    return this.repo.deleteAllSessions(userId);
  }

  // ── Connected Accounts ──────────────────────────────────────────────────

  getConnectedProviders(userId: string): Promise<string[]> {
    return this.repo.getConnectedProviders(userId);
  }

  setConnectedProviders(userId: string, providers: string[]): Promise<void> {
    return this.repo.setConnectedProviders(userId, providers);
  }

  async connectProvider(userId: string, provider: string): Promise<void> {
    const current = await this.getConnectedProviders(userId);
    if (!current.includes(provider)) {
      await this.setConnectedProviders(userId, [...current, provider]);
    }
  }

  async disconnectProvider(userId: string, provider: string): Promise<boolean> {
    const current = await this.getConnectedProviders(userId);
    if (!current.includes(provider)) return false;
    if (current.length <= 1) {
      throw new Error('At least one authentication provider must remain connected');
    }
    await this.setConnectedProviders(
      userId,
      current.filter((p) => p !== provider),
    );
    return true;
  }

  // ── Newsletter Subscribers ──────────────────────────────────────────────

  async subscribeToNewsletter(
    email: string,
    source: string = 'website'
  ): Promise<{ success: boolean; message: string; subscriber: NewsletterSubscriber }> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      throw new Error('Please provide a valid email address');
    }

    const subscriber = await this.repo.addSubscriber(trimmed, source);
    return {
      success: true,
      message: 'Thank you for subscribing!',
      subscriber,
    };
  }

  getSubscribers(): Promise<NewsletterSubscriber[]> {
    return this.repo.getSubscribers();
  }

  deleteSubscriber(id: string): Promise<boolean> {
    return this.repo.deleteSubscriber(id);
  }
}