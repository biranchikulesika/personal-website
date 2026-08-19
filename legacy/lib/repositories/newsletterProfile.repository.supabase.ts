import { NewsletterProfile } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class NewsletterProfileSupabaseRepository implements IRepository<NewsletterProfile> {
  async getAll(): Promise<NewsletterProfile[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_profiles').select('*');
    if (error) throw error;
    return data as any as NewsletterProfile[];
  }

  async getById(id: string): Promise<NewsletterProfile | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_profiles').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as any as NewsletterProfile;
  }

  async create(data: Omit<NewsletterProfile, 'id'>): Promise<NewsletterProfile | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_profiles').insert(data as any).select().single();
    if (error) throw error;
    return result as any as NewsletterProfile;
  }

  async update(id: string, data: Partial<NewsletterProfile>): Promise<NewsletterProfile | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_profiles').update(data as any).eq('id', id).select().single();
    if (error) throw error;
    return result as any as NewsletterProfile;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('newsletter_profiles').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
