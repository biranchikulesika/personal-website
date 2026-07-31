import { NewsletterIssue } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class NewsletterIssueSupabaseRepository implements IRepository<NewsletterIssue> {
  async getAll(): Promise<NewsletterIssue[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_issues').select('*');
    if (error) throw error;
    return data as any as NewsletterIssue[];
  }

  async getById(id: string): Promise<NewsletterIssue | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_issues').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as any as NewsletterIssue;
  }

  async create(data: Omit<NewsletterIssue, 'id'>): Promise<NewsletterIssue | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_issues').insert(data as any).select().single();
    if (error) throw error;
    return result as any as NewsletterIssue;
  }

  async update(id: string, data: Partial<NewsletterIssue>): Promise<NewsletterIssue | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('newsletter_issues').update(data as any).eq('id', id).select().single();
    if (error) throw error;
    return result as any as NewsletterIssue;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('newsletter_issues').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
