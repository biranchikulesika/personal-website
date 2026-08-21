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
} from '@/lib/types';
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
    revalidatePath('/admin');
    revalidatePath('/scribble');
    revalidatePath(`/p/${post.slug}`);
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
    revalidatePath('/admin');
    revalidatePath('/scribble');
    revalidatePath(`/p/${slug}`);
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
    revalidatePath('/admin');
    revalidatePath('/scribble');
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
    revalidatePath('/admin');
    revalidatePath('/scribble');
    revalidatePath(`/n/${note.slug}`);
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
    revalidatePath('/admin');
    revalidatePath('/scribble');
    revalidatePath(`/n/${slug}`);
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
    revalidatePath('/admin');
    revalidatePath('/scribble');
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
    revalidatePath('/admin');
    revalidatePath('/library');
    revalidatePath('/scribble');
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
    revalidatePath('/admin');
    revalidatePath('/library');
    revalidatePath('/scribble');
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
    revalidatePath('/admin');
    revalidatePath('/now');
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
    revalidatePath('/admin');
    revalidatePath('/now');
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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
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
    revalidatePath('/admin');
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
    revalidatePath('/');
    revalidatePath('/admin');
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
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to set featured books' };
  }
}
