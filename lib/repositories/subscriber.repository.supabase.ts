import { Subscriber } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class SubscriberSupabaseRepository implements IRepository<Subscriber> {
  async getAll(): Promise<Subscriber[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('subscribers').select('*');
    if (error) throw error;
    return data as any as Subscriber[];
  }

  async getById(id: string): Promise<Subscriber | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('subscribers').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as any as Subscriber;
  }

  async create(data: Omit<Subscriber, 'id'>): Promise<Subscriber | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('subscribers').insert(data as any).select().single();
    if (error) throw error;
    return result as any as Subscriber;
  }

  async update(id: string, data: Partial<Subscriber>): Promise<Subscriber | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('subscribers').update(data as any).eq('id', id).select().single();
    if (error) throw error;
    return result as any as Subscriber;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('subscribers').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
