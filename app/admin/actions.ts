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
import { getSupabaseUrl, getSupabasePublishableKey } from '@/lib/config/env';
import {
  BlogPostSchema,
  NoteItemSchema,
  BookItemSchema,
  NowEntrySchema,
  MediaItemSchema,
  SlugParamSchema,
  IdParamSchema,
} from '@/lib/validation';

const contentService = new ContentService();

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

// Post Actions ----------------------------------------------------------------

export async function getAllPostsAction(): Promise<BlogPost[]> {
  return await contentService.getAllPosts();
}

export async function savePostAction(
  post: BlogPost,
  persona?: Persona,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    const validated = validateInput(BlogPostSchema, post);
    const saved = await contentService.savePost(validated, persona);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/scribble');
    safeRevalidatePath(`/p/${post.slug}`);
    return { success: true, post: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save post' };
  }
}

export async function togglePostStatusAction(
  slug: string,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const toggled = await contentService.togglePostStatus(validSlug);
    if (!toggled) return { success: false, error: 'Post not found' };
    safeRevalidatePath('/admin');
    safeRevalidatePath('/scribble');
    safeRevalidatePath(`/p/${slug}`);
    return { success: true, post: toggled };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to toggle status' };
  }
}

export async function deletePostAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const deleted = await contentService.deletePost(validSlug);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/scribble');
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete post' };
  }
}

// Note Actions ----------------------------------------------------------------

export async function getAllNotesAction(): Promise<NoteItem[]> {
  return await contentService.getAllNotes();
}

export async function saveNoteAction(
  note: NoteItem,
): Promise<{ success: boolean; note?: NoteItem; error?: string }> {
  try {
    const validated = validateInput(NoteItemSchema, note);
    const saved = await contentService.saveNote(validated);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/scribble');
    safeRevalidatePath(`/n/${note.slug}`);
    return { success: true, note: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save note' };
  }
}

export async function toggleNoteStatusAction(
  slug: string,
): Promise<{ success: boolean; note?: NoteItem; error?: string }> {
  try {
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const toggled = await contentService.toggleNoteStatus(validSlug);
    if (!toggled) return { success: false, error: 'Note not found' };
    safeRevalidatePath('/admin');
    safeRevalidatePath('/scribble');
    safeRevalidatePath(`/n/${slug}`);
    return { success: true, note: toggled };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to toggle status' };
  }
}

export async function deleteNoteAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const deleted = await contentService.deleteNote(validSlug);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/scribble');
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete note' };
  }
}

// Book / Library Actions ------------------------------------------------------

export async function getAllBooksAction(): Promise<BookItem[]> {
  return await contentService.getAllBooks();
}

export async function saveBookAction(
  book: BookItem,
): Promise<{ success: boolean; book?: BookItem; error?: string }> {
  try {
    const validated = validateInput(BookItemSchema, book);
    const saved = await contentService.saveBook(validated);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/library');
    safeRevalidatePath('/scribble');
    return { success: true, book: saved };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to save book' };
  }
}

export async function deleteBookAction(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { slug: validSlug } = validateInput(SlugParamSchema, { slug });
    const deleted = await contentService.deleteBook(validSlug);
    safeRevalidatePath('/admin');
    safeRevalidatePath('/library');
    safeRevalidatePath('/scribble');
    return { success: deleted };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to delete book' };
  }
}

// Now Page Timeline Actions --------------------------------------------------

export async function getNowEntriesAction(): Promise<NowEntry[]> {
  return await contentService.getNowEntries();
}

export async function saveNowEntryAction(
  entry: NowEntry,
): Promise<{ success: boolean; entry?: NowEntry; error?: string }> {
  try {
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
  return await contentService.getMedia();
}

export async function addMediaAction(
  item: MediaItem,
): Promise<{ success: boolean; media?: MediaItem; error?: string }> {
  try {
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
  const { generateDocumentAiMetadata } = await import('@/lib/services/ai-metadata.service');
  try {
    const metadata = await generateDocumentAiMetadata(input);
    return { success: true, metadata };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to generate AI metadata',
    };
  }
}


// Featured Items Actions ------------------------------------------------------

export async function getFeaturedPostsAction(): Promise<string[]> {
  return await contentService.getFeaturedPosts();
}

export async function getFeaturedBooksAction(): Promise<string[]> {
  return await contentService.getFeaturedBooks();
}

export async function setFeaturedPostsAction(
  slugs: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await contentService.setFeaturedPosts(slugs.slice(0, 4));
    safeRevalidatePath('/');
    safeRevalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to set featured posts' };
  }
}

export async function setFeaturedBooksAction(
  slugs: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await contentService.setFeaturedBooks(slugs.slice(0, 4));
    safeRevalidatePath('/');
    safeRevalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to set featured books' };
  }
}

// Account & Security Actions --------------------------------------------------

async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getPasskeysAction(): Promise<PasskeyItem[]> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';
  return await contentService.getPasskeys(userId);
}

export async function registerPasskeyAction(params: {
  label: string;
  credentialId?: string;
}): Promise<{ success: boolean; passkey?: PasskeyItem; error?: string }> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'default';
    const newPasskey: PasskeyItem = {
      id: `pk-${Date.now()}`,
      label: params.label || 'Security Key / Passkey',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      credentialId: params.credentialId,
    };

    const saved = await contentService.savePasskey(userId, newPasskey);
    safeRevalidatePath('/admin');
    return { success: true, passkey: saved };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to register passkey',
    };
  }
}

export async function deletePasskeyAction(
  passkeyId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'default';
    const deleted = await contentService.deletePasskey(userId, passkeyId);
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
  const user = await getCurrentUser();
  const userId = user?.id || 'default';
  return await contentService.getSessions(userId);
}

export async function signOutSessionAction(
  sessionId: string,
): Promise<{ success: boolean; redirect?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'default';

    await contentService.deleteSession(userId, sessionId);

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
    const user = await getCurrentUser();
    const userId = user?.id || 'default';

    await contentService.deleteAllSessions(userId);

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

    const user = await getCurrentUser();
    const userId = user?.id || 'default';
    const current = await contentService.getConnectedProviders(userId);
    if (!current.includes(provider)) {
      await contentService.setConnectedProviders(userId, [
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
    const user = await getCurrentUser();
    const userId = user?.id || 'default';

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
      const providers = await contentService.getConnectedProviders(userId);
      if (providers.length <= 1) {
        return {
          success: false,
          error:
            'At least one authentication provider must remain connected to prevent account lockout.',
        };
      }
      const updated = providers.filter((p) => p !== provider);
      await contentService.setConnectedProviders(userId, updated);
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


