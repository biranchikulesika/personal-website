import { Subscription } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class SubscriptionSupabaseRepository implements IRepository<Subscription> {
  async getAll(): Promise<Subscription[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('subscriptions').select('*');
    if (error) throw error;
    return data as any as Subscription[];
  }

  async getById(id: string): Promise<Subscription | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('subscriptions').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as any as Subscription;
  }

  async create(data: Omit<Subscription, 'id'>): Promise<Subscription | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('subscriptions').insert(data as any).select().single();
    if (error) throw error;
    return result as any as Subscription;
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('subscriptions').update(data as any).eq('id', id).select().single();
    if (error) throw error;
    return result as any as Subscription;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('subscriptions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
