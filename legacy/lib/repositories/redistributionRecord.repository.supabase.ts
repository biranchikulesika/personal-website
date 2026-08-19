import { RedistributionRecord } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class RedistributionRecordSupabaseRepository implements IRepository<RedistributionRecord> {
  async getAll(): Promise<RedistributionRecord[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('redistribution_records').select('*');
    if (error) throw error;
    return data as any as RedistributionRecord[];
  }

  async getById(id: string): Promise<RedistributionRecord | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('redistribution_records').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as any as RedistributionRecord;
  }

  async create(data: Omit<RedistributionRecord, 'id'>): Promise<RedistributionRecord | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('redistribution_records').insert(data as any).select().single();
    if (error) throw error;
    return result as any as RedistributionRecord;
  }

  async update(id: string, data: Partial<RedistributionRecord>): Promise<RedistributionRecord | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('redistribution_records').update(data as any).eq('id', id).select().single();
    if (error) throw error;
    return result as any as RedistributionRecord;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('redistribution_records').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
