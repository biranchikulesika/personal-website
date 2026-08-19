import { JournalMoment } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class JournalMomentSupabaseRepository implements IRepository<JournalMoment> {
  private mapToDB(data: Partial<JournalMoment>): any {
    const dbObj: any = {};
    if (data.body !== undefined) dbObj.content = data.body;
    if (data.title !== undefined) dbObj.title = data.title;
    if (data.timeLabel !== undefined) dbObj.time_label = data.timeLabel;
    if (data.hidden !== undefined) dbObj.hidden = data.hidden;
    return dbObj;
  }

  private mapToEntity(dbData: any): JournalMoment {
    // Prefer new proper columns, fall back to old mood hack for backward compat
    const title = dbData.title || (dbData.mood ? (dbData.mood.includes(' | ') ? dbData.mood.split(' | ')[0] : dbData.mood) : '');
    const timeLabel = dbData.time_label || (dbData.mood && dbData.mood.includes(' | ') ? dbData.mood.split(' | ')[1] : '');

    return {
      id: dbData.id,
      title: title,
      body: dbData.content || '',
      timeLabel: timeLabel,
      hidden: dbData.hidden || false,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
    };
  }

  async getAll(): Promise<JournalMoment[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('journal_moments').select('*');
    if (error) throw error;
    return (data || []).map(this.mapToEntity);
  }

  async getById(id: string): Promise<JournalMoment | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('journal_moments').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapToEntity(data);
  }

  async create(data: Omit<JournalMoment, 'id'>): Promise<JournalMoment | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('journal_moments').insert(this.mapToDB(data)).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<JournalMoment>): Promise<JournalMoment | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('journal_moments').update(this.mapToDB(data)).eq('id', id).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('journal_moments').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
