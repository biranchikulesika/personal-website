import { FieldNote } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class FieldNoteSupabaseRepository implements IRepository<FieldNote> {
  async getAll(): Promise<FieldNote[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('field_notes').select('*');
    if (error) throw error;
    return data as any as FieldNote[];
  }

  async getById(id: string): Promise<FieldNote | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('field_notes').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as any as FieldNote;
  }

  async create(data: Omit<FieldNote, 'id'>): Promise<FieldNote | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('field_notes').insert(data as any).select().single();
    if (error) throw error;
    return result as any as FieldNote;
  }

  async update(id: string, data: Partial<FieldNote>): Promise<FieldNote | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('field_notes').update(data as any).eq('id', id).select().single();
    if (error) throw error;
    return result as any as FieldNote;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('field_notes').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
