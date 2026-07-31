import { BuilderStatus } from '../types';
import { IRepository } from './registry';
import { getSupabaseServerClient } from '../supabase/server';

export class BuilderStatusSupabaseRepository implements IRepository<BuilderStatus> {
  private mapToDB(data: Partial<BuilderStatus>): any {
    const dbObj: any = {};
    if (data.operationalState !== undefined) dbObj.operational_state = data.operationalState;
    if (data.statusText !== undefined) dbObj.status_text = data.statusText;
    if (data.currentFocus !== undefined) dbObj.current_focus = data.currentFocus;
    // Map properties from UI dialog as well, since they might pass 'label', 'value'
    if ((data as any).label !== undefined) dbObj.operational_state = (data as any).label;
    if ((data as any).value !== undefined) dbObj.status_text = (data as any).value;
    return dbObj;
  }

  private mapToEntity(dbData: any): BuilderStatus {
    return {
      id: dbData.id,
      operationalState: dbData.operational_state || '',
      statusText: dbData.status_text || '',
      currentFocus: dbData.current_focus || '',
      label: dbData.operational_state || '', // UI mapping
      value: dbData.status_text || '', // UI mapping
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
    } as any;
  }

  async getAll(): Promise<BuilderStatus[]> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('builder_status').select('*');
    if (error) throw error;
    return (data || []).map(this.mapToEntity);
  }

  async getById(id: string): Promise<BuilderStatus | null> {
    const { data, error } = await ((await getSupabaseServerClient()) as any).from('builder_status').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapToEntity(data);
  }

  async create(data: Omit<BuilderStatus, 'id'>): Promise<BuilderStatus | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('builder_status').insert(this.mapToDB(data)).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<BuilderStatus>): Promise<BuilderStatus | null> {
    const { data: result, error } = await ((await getSupabaseServerClient()) as any).from('builder_status').update(this.mapToDB(data)).eq('id', id).select().single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await ((await getSupabaseServerClient()) as any).from('builder_status').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
