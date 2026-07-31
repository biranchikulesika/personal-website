import { Question } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class QuestionSupabaseRepository implements IRepository<Question> {
  private mapToDB(data: Partial<Question>): any {
    const dbObj: any = {};
    if (data.question !== undefined || data.text !== undefined) dbObj.question = data.text || data.question;
    if (data.context !== undefined) dbObj.answer = data.context;
    if (data.hidden !== undefined) {
      dbObj.hidden = data.hidden;
      dbObj.status = data.hidden ? 'archived' : 'open'; // Keep status in sync for backward compat
    }
    if (data.order !== undefined) dbObj["order"] = data.order;
    return dbObj;
  }

  private mapToEntity(dbData: any): Question {
    return {
      id: dbData.id,
      text: dbData.question || '',
      question: dbData.question || '',
      context: dbData.answer || '',
      order: dbData["order"] || 0,
      hidden: dbData.hidden === null || dbData.hidden === undefined
        ? dbData.status === 'archived'  // backward compat: no hidden column yet
        : dbData.hidden,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
    };
  }

  async getAll(): Promise<Question[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('questions').select('*');
    if (error) throw error;
    return (data || []).map(this.mapToEntity);
  }

  async getById(id: string): Promise<Question | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('questions').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapToEntity(data);
  }

  async create(data: Omit<Question, 'id'>): Promise<Question | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('questions').insert(this.mapToDB(data)).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<Question>): Promise<Question | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('questions').update(this.mapToDB(data)).eq('id', id).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('questions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
