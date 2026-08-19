import { BuildLog } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class BuildLogSupabaseRepository implements IRepository<BuildLog> {
  private mapToDB(data: Partial<BuildLog>): any {
    const dbObj: any = {};
    if (data.title !== undefined) dbObj.title = data.title;
    if (data.category !== undefined) dbObj.category = data.category;
    if (data.shortSummary !== undefined) dbObj.short_summary = data.shortSummary;
    if (data.longSummary !== undefined) dbObj.long_summary = data.longSummary;
    if (data.description !== undefined) dbObj.description = data.description;
    if (data.date !== undefined) dbObj.date = data.date;
    if (data.source !== undefined) dbObj.source = data.source;
    if (data.aiGenerated !== undefined) dbObj.ai_generated = data.aiGenerated;
    if (data.generatedAt !== undefined) dbObj.generated_at = data.generatedAt;
    if (data.generationModel !== undefined) dbObj.generation_model = data.generationModel;
    if (data.relatedCommits !== undefined) dbObj.related_commits = data.relatedCommits;
    if (data.relatedRepositories !== undefined) dbObj.related_repositories = data.relatedRepositories;
    if (data.hidden !== undefined) dbObj.hidden = data.hidden;
    return dbObj;
  }

  private mapToEntity(dbData: any): BuildLog {
    return {
      id: dbData.id,
      title: dbData.title || '',
      category: dbData.category || '',
      shortSummary: dbData.short_summary || '',
      longSummary: dbData.long_summary || '',
      description: dbData.description || '',
      date: dbData.date || dbData.created_at,
      source: dbData.source || 'manual',
      aiGenerated: dbData.ai_generated || false,
      generatedAt: dbData.generated_at,
      generationModel: dbData.generation_model,
      relatedCommits: dbData.related_commits || [],
      relatedRepositories: dbData.related_repositories || [],
      hidden: dbData.hidden || false,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
    };
  }


  async getAll(): Promise<BuildLog[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('build_logs').select('*');
    if (error) throw error;
    return (data || []).map(this.mapToEntity);
  }

  async getById(id: string): Promise<BuildLog | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('build_logs').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapToEntity(data);
  }

  async create(data: Omit<BuildLog, 'id'>): Promise<BuildLog | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('build_logs').insert(this.mapToDB(data)).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<BuildLog>): Promise<BuildLog | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('build_logs').update(this.mapToDB(data)).eq('id', id).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('build_logs').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
