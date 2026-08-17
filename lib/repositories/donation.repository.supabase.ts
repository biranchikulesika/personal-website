import { Donation } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient, getSupabaseAdmin } from '../supabase/server';

export class DonationSupabaseRepository implements IRepository<Donation> {
  async getAll(): Promise<Donation[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('donations').select('*');
    if (error) throw error;
    return data as any as Donation[];
  }

  async getById(id: string): Promise<Donation | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('donations').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as any as Donation;
  }

  async create(data: Omit<Donation, 'id'>): Promise<Donation | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('donations').insert(data as any).select().single();
    if (error) throw error;
    return result as any as Donation;
  }

  async update(id: string, data: Partial<Donation>): Promise<Donation | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('donations').update(data as any).eq('id', id).select().single();
    if (error) throw error;
    return result as any as Donation;
  }

  async delete(id: string): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from('donations').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async deleteExpiredPending(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('donations')
      .delete()
      .eq('status', 'pending')
      .lt('createdAt', cutoffDate.toISOString())
      .select('id');
    if (error) throw error;
    return data ? data.length : 0;
  }
}

