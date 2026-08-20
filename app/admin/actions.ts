'use server';

import { ContentService } from '@/lib/services/content.service';
import { revalidatePath } from 'next/cache';
import type {
  AdminProfile,
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  Persona,
} from '@/lib/types';

const contentService = new ContentService();

// Post Actions ----------------------------------------------------------------

export async function getAllPostsAction(): Promise<BlogPost[]> {
  return await contentService.getAllPosts();
}

export async function savePostAction(
  post: BlogPost,
  persona?: Persona,
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    const saved = await contentService.savePost(post, persona);
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
    const toggled = await contentService.togglePostStatus(slug);
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
    const deleted = await contentService.deletePost(slug);
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
    const saved = await contentService.saveNote(note);
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
    const toggled = await contentService.toggleNoteStatus(slug);
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
    const deleted = await contentService.deleteNote(slug);
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
    const saved = await contentService.saveBook(book);
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
    const deleted = await contentService.deleteBook(slug);
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
    const saved = await contentService.saveNowEntry(entry);
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
    const deleted = await contentService.deleteNowEntry(id);
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
    const added = await contentService.addMedia(item);
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
    const deleted = await contentService.deleteMedia(id);
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

// Admin Profile Actions -------------------------------------------------------

export async function getAdminProfileAction(): Promise<AdminProfile> {
  return await contentService.getAdminProfile();
}

export async function updateAdminProfileAction(
  profile: Partial<AdminProfile>,
): Promise<{ success: boolean; profile?: AdminProfile; error?: string }> {
  try {
    const updated = await contentService.updateAdminProfile(profile);
    revalidatePath('/admin');
    return { success: true, profile: updated };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to update profile' };
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

