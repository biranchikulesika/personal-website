'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { PostService } from '@/lib/services/post.service';
import { postSchema, updatePostSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

const postService = new PostService();

export type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };

function handleError(error: any): { success: false; error: string } {
  console.error("Action error:", error);
  let message = error?.message || 'An unexpected error occurred. Please try again.';
  if (error?.message) {
    if (error.message.includes('23505') || error.message.includes('duplicate key')) {
      message = 'A record with this identifier or slug already exists.';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('timeout')) {
      message = 'Database connection error. Please try again.';
    }
  }
  return { success: false, error: message };
}

export async function getPosts(searchQuery?: string): Promise<ActionResponse<any[]>> {
  try {
    await verifyAuth();
    const data = await postService.getAll(searchQuery);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPostById(id: string): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    const data = await postService.getById(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPostBySlug(slug: string): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    if (slug) {
      const data = await postService.getBySlug(slug);
      return { success: true, data };
    }
    return { success: true, data: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function checkSlugExists(slug: string, currentId: string | null, persona: string): Promise<ActionResponse<boolean>> {
  try {
    const data = await postService.checkSlugExists(slug, currentId, persona);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createPost(data: any): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    const validData = postSchema.parse(data);
    const result = await postService.create(validData as any);
    
    // Revalidate ISR caches
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    if (result?.slug) {
      revalidatePath(`/p/${result.slug}`, 'page');
    }
    const persona = result?.persona || data?.persona;
    if (persona) {
      revalidatePath(`/${persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePost(id: string, data: any): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    const validData = updatePostSchema.parse(data);
    const result = await postService.update(id, validData as any);
    
    // Revalidate ISR caches
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    const slug = result?.slug || data?.slug;
    if (slug) {
      revalidatePath(`/p/${slug}`, 'page');
    }
    const persona = result?.persona || data?.persona;
    if (persona) {
      revalidatePath(`/${persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePost(id: string): Promise<ActionResponse<boolean>> {
  try {
    await verifyAuth();
    // Fetch post first to get slug/persona for targeted revalidation
    const existing = await postService.getById(id);
    const slug = existing?.slug;
    const persona = existing?.persona;
    
    const result = await postService.delete(id);
    
    // Revalidate ISR caches
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    if (slug) {
      revalidatePath(`/p/${slug}`, 'page');
    }
    if (persona) {
      revalidatePath(`/${persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function hidePost(id: string): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    const result = await postService.hide(id);
    
    // Revalidate ISR caches
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    if (result?.slug) {
      revalidatePath(`/p/${result.slug}`, 'page');
    }
    if (result?.persona) {
      revalidatePath(`/${result.persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function unhidePost(id: string): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    const result = await postService.unhide(id);
    
    // Revalidate ISR caches
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    if (result?.slug) {
      revalidatePath(`/p/${result.slug}`, 'page');
    }
    if (result?.persona) {
      revalidatePath(`/${result.persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function featurePost(id: string): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    const result = await postService.feature(id);
    
    // Revalidate ISR caches (featured posts appear on blog listing)
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    if (result?.slug) {
      revalidatePath(`/p/${result.slug}`, 'page');
    }
    if (result?.persona) {
      revalidatePath(`/${result.persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function unfeaturePost(id: string): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    const result = await postService.unfeature(id);
    
    // Revalidate ISR caches
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    if (result?.slug) {
      revalidatePath(`/p/${result.slug}`, 'page');
    }
    if (result?.persona) {
      revalidatePath(`/${result.persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function revertPostToDraft(id: string): Promise<ActionResponse<any>> {
  try {
    await verifyAuth();
    // FIX: Preserve publishedAt when reverting to draft so the original publish
    // date is not lost. If republished later, the original date can be used.
    const existing = await postService.getById(id);
    const result = await postService.update(id, {
      status: 'draft',
      // Keep publishedAt intact — don't null it out
      publishedAt: existing?.publishedAt || null
    } as any);
    
    // Revalidate ISR caches
    revalidatePath('/blogs', 'page');
    revalidatePath('/', 'page');
    if (result?.slug) {
      revalidatePath(`/p/${result.slug}`, 'page');
    }
    if (result?.persona) {
      revalidatePath(`/${result.persona}/blogs`, 'page');
    }
    revalidatePath('/sitemap.xml', 'layout');
    
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
