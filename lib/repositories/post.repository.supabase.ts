import { Post } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';
import { z } from 'zod';

const UpdatePostDTO = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  byline: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  draftContent: z.string().optional(),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  persona: z.string().optional(),
  coverImageUrl: z.string().nullable().optional(),
  coverImageAlt: z.string().nullable().optional(),
  coverImageCaption: z.string().nullable().optional(),
  coverImageLocation: z.string().nullable().optional(),
  coverImageCredit: z.string().nullable().optional(),
  autoCoverImage: z.boolean().optional(),
  readingTime: z.number().nullable().optional(),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  oldSlugs: z.array(z.string()).optional(),
}).strip();

function toDbFormat(data: Partial<Post>) {
  const result: any = {
    title: data.title !== undefined ? data.title : null,
    subtitle: data.subtitle !== undefined ? data.subtitle : null,
    byline: data.byline !== undefined ? data.byline : null,
    slug: data.slug !== undefined ? data.slug : null,
    content: data.content !== undefined ? data.content : null,
    draft_content: data.draftContent !== undefined ? data.draftContent : null,
    excerpt: data.excerpt !== undefined ? data.excerpt : null,
    persona: data.persona !== undefined ? data.persona : 'unassigned',
    cover_image_url: data.coverImageUrl || null,
    cover_image_alt: data.coverImageAlt || null,
    cover_image_caption: data.coverImageCaption || null,
    cover_image_location: data.coverImageLocation || null,
    cover_image_credit: data.coverImageCredit || null,
    auto_cover_image: data.autoCoverImage !== undefined ? data.autoCoverImage : true,
    reading_time: typeof data.readingTime === 'number' && !isNaN(data.readingTime) ? data.readingTime : null,
    featured: data.featured !== undefined ? data.featured : false,
    hidden: data.hidden !== undefined ? data.hidden : false,
    tags: Array.isArray(data.tags) ? data.tags : [],
    old_slugs: Array.isArray(data.oldSlugs) ? data.oldSlugs : []
  };

  if (data.status !== undefined) {
    result.status = data.status;
  }

  if (data.publishedAt !== undefined) {
    result.published_at = (typeof data.publishedAt === 'string' && data.publishedAt.trim() !== '') ? data.publishedAt.trim() : null;
  }

  // Remove any remaining undefined values
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) delete result[key];
  });

  return result;
}

function fromDbFormat(dbData: any): Post {
  if (!dbData) return dbData;

  // Normalize coverImageUrl: if it's a relative storage path (no protocol),
  // resolve it to the full Supabase public URL. This handles the case where
  // the MDX editor's auto-cover extraction stores the relative storage path
  // (e.g., "2026/07/15/uuid.png") instead of the full public URL.
  let coverImageUrl = dbData.cover_image_url;
  if (coverImageUrl && !/^(https?:\/\/|\/)/i.test(coverImageUrl)) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      coverImageUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${coverImageUrl}`;
    } else {
      // Fallback: prepend slash so next/image can at least attempt the relative path
      coverImageUrl = `/${coverImageUrl}`;
    }
  }

  return {
    id: dbData.id,
    title: dbData.title,
    subtitle: dbData.subtitle,
    byline: dbData.byline,
    slug: dbData.slug,
    content: dbData.content,
    draftContent: dbData.draft_content,
    excerpt: dbData.excerpt,
    status: dbData.status,
    persona: dbData.persona,
    coverImageUrl,
    coverImageAlt: dbData.cover_image_alt,
    coverImageCaption: dbData.cover_image_caption,
    coverImageLocation: dbData.cover_image_location,
    coverImageCredit: dbData.cover_image_credit,
    autoCoverImage: dbData.auto_cover_image,
    readingTime: dbData.reading_time,
    featured: dbData.featured,
    hidden: dbData.hidden,
    publishedAt: dbData.published_at,
    tags: dbData.tags || [],
    oldSlugs: dbData.old_slugs || [],
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at
  };
}

function formatSearchQuery(query: string) {
  return query
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => `${word}:*`)
    .join(' & ');
}

export class PostSupabaseRepository implements IRepository<Post> {
  async getAll(searchQuery?: string): Promise<Post[]> {
    let query = ((await getSupabaseServerClient()) as any).from('posts').select('*').order('created_at', { ascending: false });
    
    if (searchQuery && searchQuery.trim() !== '') {
      const q = formatSearchQuery(searchQuery);
      if (q) {
        query = query.textSearch('fts', q);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
    return (data || []).map(fromDbFormat);
  }

  async getAllMeta(searchQuery?: string): Promise<Post[]> {
    const now = new Date().toISOString();
    let query = ((await getSupabaseServerClient()) as any).from('posts')
      .select('id, title, subtitle, byline, slug, old_slugs, excerpt, status, persona, cover_image_url, cover_image_alt, cover_image_caption, cover_image_location, cover_image_credit, auto_cover_image, reading_time, featured, hidden, published_at, tags, created_at, updated_at')
      .eq('status', 'published')
      .lte('published_at', now)
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim() !== '') {
      const q = formatSearchQuery(searchQuery);
      if (q) {
        query = query.textSearch('fts', q);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
    return (data || []).map(fromDbFormat);
  }

  async getById(id: string): Promise<Post | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('posts').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
    if (!data) return null;
    return fromDbFormat(data);
  }

  async getBySlug(slug: string, persona?: string): Promise<Post | null> {
    let query = ((await getSupabaseServerClient()) as any).from('posts').select('*').eq('slug', slug);
    if (persona) {
      query = query.eq('persona', persona);
    }
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
    if (!data) return null;
    return fromDbFormat(data);
  }

  async checkSlugExists(slug: string, currentId: string | null, persona: string): Promise<boolean> {
    let query = ((await getSupabaseServerClient()) as any).from('posts').select('id', { count: 'exact', head: true }).eq('slug', slug).eq('persona', persona);
    if (currentId) {
      query = query.neq('id', currentId);
    }
    const { count, error } = await query;
    if (error) throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
    return (count || 0) > 0;
  }

  async create(data: Omit<Post, 'id'>): Promise<Post | null> {
    const payload = toDbFormat(data);
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('posts').insert(payload).select().single();
    if (error) throw new Error(`Database Error on Create [${error.code}]: ${error.message}`);
    return fromDbFormat(result);
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    const sanitizedData = UpdatePostDTO.parse(data);
    const payload = toDbFormat(sanitizedData as Partial<Post>);
    
    // Remove undefined values, leave nulls for deletion
    Object.keys(payload).forEach(key => {
      if ((payload as any)[key] === undefined) delete (payload as any)[key];
    });

    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('posts').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Database Error on Update [${error.code}]: ${error.message}`);
    return fromDbFormat(result);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('posts').delete().eq('id', id);
    if (error) throw new Error(`Database Error on Delete [${error.code}]: ${error.message}`);
    return true;
  }
}
