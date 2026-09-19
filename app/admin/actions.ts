'use server';

import { ContentService } from '@/lib/services/content.service';
import { revalidatePath } from 'next/cache';
import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
  PasskeyItem,
  UserSession,
} from '@/lib/types';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/auth/admin';
import { getSupabaseUrl, getSupabasePublishableKey } from '@/lib/config/env';
import {
  BlogPostSchema,
  NoteItemSchema,
  BookItemSchema,
  NowEntrySchema,
  MediaItemSchema,
  SlugParamSchema,
  IdParamSchema,
  NewsletterSubscriberSchema,
} from '@/lib/validation';

import { headers } from 'next/headers';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/server';
import {
  getWebAuthnExpectedOrigin,
  getWebAuthnRpID,
  getWebAuthnRpName,
  setPasskeyChallengeCookie,
  consumePasskeyChallengeCookie,
} from '@/lib/auth/webauthn';

const contentService = new ContentService();

/**
 * Server-side authorization helper that verifies the requesting user is authenticated
 * and possesses an administrative role ('content_admin' or 'super_admin') from the trusted database.
 * Throws an Error if unauthenticated or unauthorized.
 */
async function assertAdminUser() {
  let user = null;
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (!error && authUser) {
      user = authUser;
    }
  } catch {
    user = null;
  }

  if (!user) {
    throw new Error('Unauthorized: Administrative authentication required');
  }

  const role = await contentService.getUserRole(user.id);

  if (!isAdminRole(role)) {
    throw new Error('Forbidden: Administrative privileges required');
  }

  return { user, role };
}

/**
 * Server-side authorization helper that verifies the requesting user has an active authenticated session.
 * Throws an Error if unauthenticated.
 */
async function assertAuthenticatedUser() {
  let user = null;
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (!error && authUser) {
      user = authUser;
    }
  } catch {
    user = null;
  }

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  return user;
}

/**
 * Validate input against a Zod schema. Returns the parsed data or throws
 * a descriptive error. Server actions must validate all client-supplied
 * data at the server boundary.
 */
function validateInput<T>(schema: { parse: (v: unknown) => T }, input: unknown): T {
  return schema.parse(input);
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // revalidatePath throws when called outside Next.js request context (e.g. tests)
  }
}

function revalidateContent(paths: string[]): void {
  safeRevalidatePath('/admin');
  for (const path of paths) safeRevalidatePath(path);
}

// Post Actions ----------------------------------------------------------------

export async function getAllPostsAction(): Promise<BlogPost[]> {
  await assertAdminUser();
  return await contentService.getAllPosts();
}

export async function savePostAction(
  post: BlogPost,
  persona?: Persona,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    await assertAdminUser();
    const validated = validateInput(BlogPostSchema, post);
    const saved = await contentService.savePost(validated, persona);
    revalidateContent(['/scribble', `/p/${post.slug}`]);
    return { success: true, post: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save post' };
  }
}

export async function togglePostStatusAction(
  slug: string,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    await assertAdminUser();
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const toggled = await contentService.togglePostStatus(validSlug);
    if (!toggled) return { success: false, error: 'Post not found' };
    revalidateContent(['/scribble', `/p/${slug}`]);
    return { success: true, post: toggled };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to toggle status' };
  }
}

export async function deletePostAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminUser();
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const deleted = await contentService.deletePost(validSlug);
    revalidateContent(['/scribble']);
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete post' };
  }
}

// Note Actions ----------------------------------------------------------------

export async function getAllNotesAction(): Promise<NoteItem[]> {
  await assertAdminUser();
  return await contentService.getAllNotes();
}

export async function saveNoteAction(
  note: NoteItem,
): Promise<{ success: boolean; note?: NoteItem; error?: string }> {
  try {
    await assertAdminUser();
    const validated = validateInput(NoteItemSchema, note);
    const saved = await contentService.saveNote(validated);
    revalidateContent(['/scribble', `/n/${note.slug}`]);
    return { success: true, note: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save note' };
  }
}

export async function toggleNoteStatusAction(
  slug: string,
): Promise<{ success: boolean; note?: NoteItem; error?: string }> {
  try {
    await assertAdminUser();
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const toggled = await contentService.toggleNoteStatus(validSlug);
    if (!toggled) return { success: false, error: 'Note not found' };
    revalidateContent(['/scribble', `/n/${slug}`]);
    return { success: true, note: toggled };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to toggle status' };
  }
}

export async function deleteNoteAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminUser();
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const deleted = await contentService.deleteNote(validSlug);
    revalidateContent(['/scribble']);
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete note' };
  }
}

// Book / Library Actions ------------------------------------------------------

export async function getAllBooksAction(): Promise<BookItem[]> {
  await assertAdminUser();
  return await contentService.getAllBooks();
}

export async function saveBookAction(
  book: BookItem,
): Promise<{ success: boolean; book?: BookItem; error?: string }> {
  try {
    await assertAdminUser();
    const validated = validateInput(BookItemSchema, book);
    const saved = await contentService.saveBook(validated);
    revalidateContent(['/scribble', '/library']);
    return { success: true, book: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save book' };
  }
}

export async function deleteBookAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminUser();
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const deleted = await contentService.deleteBook(validSlug);
    revalidateContent(['/scribble', '/library']);
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete book' };
  }
}

export async function toggleBookStatusAction(
  slug: string,
): Promise<{ success: boolean; book?: BookItem; error?: string }> {
  try {
    await assertAdminUser();
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const book = await contentService.toggleBookStatus(validSlug);
    if (!book) return { success: false, error: 'Book not found' };
    revalidateContent(['/scribble', '/library']);
    return { success: true, book };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to toggle book status' };
  }
}

// Now Page Timeline Actions --------------------------------------------------

export async function getNowEntriesAction(): Promise<NowEntry[]> {
  await assertAdminUser();
  return await contentService.getNowEntries();
}

export async function saveNowEntryAction(
  entry: NowEntry,
): Promise<{ success: boolean; entry?: NowEntry; error?: string }> {
  try {
    await assertAdminUser();
    const validated = validateInput(NowEntrySchema, entry);
    const saved = await contentService.saveNowEntry(validated);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/now');
    return { success: true, entry: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save now entry' };
  }
}

export async function deleteNowEntryAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminUser();
    const { id: validId } = validateInput(IdParamSchema, { id });
    const deleted = await contentService.deleteNowEntry(validId);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/now');
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete now entry' };
  }
}

// Media Actions ---------------------------------------------------------------

export async function getMediaAction(): Promise<MediaItem[]> {
  await assertAdminUser();
  return await contentService.getMedia();
}

export async function addMediaAction(
  item: MediaItem,
): Promise<{ success: boolean; media?: MediaItem; error?: string }> {
  try {
    await assertAdminUser();
    const validated = validateInput(MediaItemSchema, item);
    const added = await contentService.addMedia(validated);
    safeRevalidatePath('/admin');
    return { success: true, media: added };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to add media' };
  }
}

export async function deleteMediaAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminUser();
    const { id: validId } = validateInput(IdParamSchema, { id });
    const deleted = await contentService.deleteMedia(validId);
    safeRevalidatePath('/admin');
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete media' };
  }
}

export async function deleteOrphanedMediaAction(
  srcs: string[],
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    await assertAdminUser();
    const deletedCount = await contentService.deleteStorageAssets(srcs);
    safeRevalidatePath('/admin');
    return { success: deletedCount > 0, deletedCount };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to delete orphaned assets',
    };
  }
}

// AI Metadata & Summarization Actions -----------------------------------------

export async function generateAiMetadataAction(input: {
  title: string;
  content: string;
  persona?: Persona;
  docType?: 'post' | 'note';
}) {
  try {
    await assertAdminUser();
    const { generateDocumentAiMetadata } = await import('@/lib/services/ai-metadata.service');
    const metadata = await generateDocumentAiMetadata(input);
    return { success: true, metadata };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to generate AI metadata',
    };
  }
}

// Account & Security Actions --------------------------------------------------

export async function getPasskeysAction(): Promise<PasskeyItem[]> {
  const user = await assertAuthenticatedUser();
  return await contentService.getPasskeys(user.id);
}

export async function startPasskeyRegistrationAction(): Promise<{
  success: boolean;
  options?: PublicKeyCredentialCreationOptionsJSON;
  error?: string;
}> {
  try {
    const { user } = await assertAdminUser();
    let hostname: string | undefined;
    try {
      const headerList = await headers();
      hostname = headerList.get('host') || undefined;
    } catch {
      // Safe outside request context
    }

    const rpID = getWebAuthnRpID(hostname);
    const existingPasskeys = await contentService.getPasskeys(user.id);

    const options = await generateRegistrationOptions({
      rpName: getWebAuthnRpName(),
      rpID,
      userID: Buffer.from(user.id, 'utf-8'),
      userName: user.email || `admin@${rpID}`,
      userDisplayName: user.user_metadata?.name || 'Administrator',
      attestationType: 'none',
      excludeCredentials: existingPasskeys
        .filter((p) => Boolean(p.credentialId || p.id))
        .map((p) => ({
          id: p.credentialId || p.id,
          transports: p.transports as any,
        })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    await setPasskeyChallengeCookie({
      challenge: options.challenge,
      userId: user.id,
      action: 'registration',
    });

    return { success: true, options };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to start passkey registration',
    };
  }
}

export async function verifyPasskeyRegistrationAction(params: {
  response: RegistrationResponseJSON;
  label?: string;
}): Promise<{ success: boolean; passkey?: PasskeyItem; error?: string }> {
  try {
    const { user } = await assertAdminUser();

    // 1. Consume and invalidate the registration challenge cookie
    const expectedChallenge = await consumePasskeyChallengeCookie('registration');
    if (!expectedChallenge) {
      return {
        success: false,
        error: 'Passkey registration session expired or invalid. Please try again.',
      };
    }

    if (!params.response || !params.response.id) {
      return {
        success: false,
        error: 'Missing or malformed WebAuthn registration response.',
      };
    }

    let hostname: string | undefined;
    let origin: string | undefined;
    try {
      const headerList = await headers();
      hostname = headerList.get('host') || undefined;
      origin = headerList.get('origin') || undefined;
    } catch {
      // Safe outside request context
    }

    const expectedRPID = getWebAuthnRpID(hostname);
    const expectedOrigin = getWebAuthnExpectedOrigin(origin);

    // 2. Cryptographically verify the registration response
    const verification = await verifyRegistrationResponse({
      response: params.response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return {
        success: false,
        error: 'WebAuthn registration verification failed.',
      };
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // 3. Construct and persist genuine passkey credential with public key
    const newPasskey: PasskeyItem = {
      id: `pk-${Date.now()}`,
      label: params.label?.trim() || 'Security Key / Passkey',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: params.response.response.transports as any,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    };

    const saved = await contentService.savePasskey(user.id, newPasskey);
    safeRevalidatePath('/admin');
    return { success: true, passkey: saved };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to verify and register passkey',
    };
  }
}

export async function registerPasskeyAction(_params: {
  label: string;
  credentialId?: string;
}): Promise<{ success: boolean; passkey?: PasskeyItem; error?: string }> {
  return {
    success: false,
    error: 'Unverified passkey registration is disabled. Use the full WebAuthn registration ceremony.',
  };
}

export async function deletePasskeyAction(
  passkeyId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await assertAuthenticatedUser();
    const deleted = await contentService.deletePasskey(user.id, passkeyId);
    safeRevalidatePath('/admin');
    return { success: deleted };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to remove passkey',
    };
  }
}

export async function getSessionsAction(): Promise<UserSession[]> {
  const user = await assertAuthenticatedUser();
  return await contentService.getSessions(user.id);
}

export async function signOutSessionAction(
  sessionId: string,
): Promise<{ success: boolean; redirect?: string; error?: string }> {
  try {
    const user = await assertAuthenticatedUser();

    await contentService.deleteSession(user.id, sessionId);

    if (
      sessionId === 'sess-current' ||
      sessionId === 'session-primary' ||
      sessionId.startsWith('sess-curr')
    ) {
      try {
        const supabase = await getSupabaseServer();
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Safe to ignore
      }
      return { success: true, redirect: '/admin/login' };
    }

    safeRevalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to sign out session',
    };
  }
}

export async function signOutAllSessionsAction(): Promise<{
  success: boolean;
  redirect?: string;
  error?: string;
}> {
  try {
    const user = await assertAuthenticatedUser();

    await contentService.deleteAllSessions(user.id);

    try {
      const supabase = await getSupabaseServer();
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // Safe to ignore
    }

    return { success: true, redirect: '/admin/login' };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to sign out of all sessions',
    };
  }
}

export async function connectProviderAction(
  provider: 'google' | 'github',
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const user = await assertAuthenticatedUser();
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabasePublishableKey();

    if (supabaseUrl && supabaseKey) {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/auth/callback?next=/admin`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url) {
        return { success: true, url: data.url };
      }
    }

    const current = await contentService.getConnectedProviders(user.id);
    if (!current.includes(provider)) {
      await contentService.setConnectedProviders(user.id, [
        ...current,
        provider,
      ]);
    }
    safeRevalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to connect account',
    };
  }
}

export async function disconnectProviderAction(
  provider: 'google' | 'github',
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await assertAuthenticatedUser();
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabasePublishableKey();

    if (supabaseUrl && supabaseKey && user) {
      const identities = user.identities || [];
      const providers = identities.map((i) => i.provider);
      if (providers.length <= 1) {
        return {
          success: false,
          error:
            'At least one authentication provider must remain connected to prevent account lockout.',
        };
      }

      const targetIdentity = identities.find((i) => i.provider === provider);
      if (!targetIdentity) {
        return { success: false, error: 'Identity not found' };
      }

      const supabase = await getSupabaseServer();
      const { error } = await supabase.auth.unlinkIdentity(targetIdentity);
      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      const providers = await contentService.getConnectedProviders(user.id);
      if (providers.length <= 1) {
        return {
          success: false,
          error:
            'At least one authentication provider must remain connected to prevent account lockout.',
        };
      }
      const updated = providers.filter((p) => p !== provider);
      await contentService.setConnectedProviders(user.id, updated);
    }

    safeRevalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to disconnect account',
    };
  }
}

// ── Newsletter Actions ──────────────────────────────────────────────────────

export async function subscribeToNewsletterAction(formData: {
  email: string;
  source?: string;
}) {
  try {
    const validated = validateInput(NewsletterSubscriberSchema, formData);
    const result = await contentService.subscribeToNewsletter(
      validated.email,
      validated.source || 'website'
    );
    safeRevalidatePath('/admin');
    return { success: true, message: result.message, subscriber: result.subscriber };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Subscription failed',
    };
  }
}

export async function deleteSubscriberAction(id: string) {
  try {
    await assertAdminUser();
    const validated = validateInput(IdParamSchema, { id });
    const success = await contentService.deleteSubscriber(validated.id);
    safeRevalidatePath('/admin');
    return { success };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to delete subscriber',
    };
  }
}
