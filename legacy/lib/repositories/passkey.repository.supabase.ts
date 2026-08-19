import { PasskeyCredential } from '../types';
import { getSupabaseAdmin } from '../supabase/server';

export class PasskeySupabaseRepository {
  async getByUserId(userId: string): Promise<PasskeyCredential[]> {
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from('passkey_credentials')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          // Table not yet migrated or empty
          return [];
        }
        console.warn('Could not query passkeys table:', error.message);
        return [];
      }
      return (data || []) as any as PasskeyCredential[];
    } catch {
      return [];
    }
  }

  async getByCredentialId(credentialId: string): Promise<PasskeyCredential | null> {
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from('passkey_credentials')
        .select('*')
        .eq('credentialId', credentialId)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return null;
        }
        console.warn('Could not query passkey by credentialId:', error.message);
        return null;
      }
      return (data || null) as any as PasskeyCredential | null;
    } catch {
      return null;
    }
  }

  async create(data: Omit<PasskeyCredential, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasskeyCredential> {
    const admin = getSupabaseAdmin();
    const { data: created, error } = await admin
      .from('passkey_credentials')
      .insert({
        userId: data.userId,
        credentialId: data.credentialId,
        publicKey: data.publicKey,
        counter: data.counter,
        deviceType: data.deviceType,
        backedUp: data.backedUp,
        transports: data.transports,
        name: data.name,
        aaguid: data.aaguid || null,
        lastUsedAt: data.lastUsedAt || null,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error saving passkey credential:', error);
      throw error;
    }
    return created as any as PasskeyCredential;
  }

  async updateName(id: string, userId: string, name: string): Promise<PasskeyCredential | null> {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('passkey_credentials')
      .update({ name } as any)
      .eq('id', id)
      .eq('userId', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating passkey name:', error);
      throw error;
    }
    return data as any as PasskeyCredential;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('passkey_credentials')
      .delete()
      .eq('id', id)
      .eq('userId', userId);

    if (error) {
      console.error('Error deleting passkey:', error);
      throw error;
    }
    return true;
  }
}
