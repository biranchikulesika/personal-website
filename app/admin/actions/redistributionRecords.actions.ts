'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { RedistributionRecordService } from '@/lib/services/redistributionRecord.service';
import { redistributionRecordSchema } from '@/lib/schemas';

const redistributionRecordService = new RedistributionRecordService();

export async function getRedistributionRecords() {
  await verifyAuth();
  return await redistributionRecordService.getAll();
}

export async function getRedistributionRecordById(id: string) {
  await verifyAuth();
  return await redistributionRecordService.getById(id);
}

export async function createRedistributionRecord(data: any) {
  await verifyAuth();
  const validData = redistributionRecordSchema.parse(data);
  return await redistributionRecordService.create(validData as any);
}

export async function updateRedistributionRecord(id: string, data: any) {
  await verifyAuth();
  const validData = redistributionRecordSchema.parse(data);
  return await redistributionRecordService.update(id, validData as any);
}

export async function deleteRedistributionRecord(id: string) {
  await verifyAuth();
  return await redistributionRecordService.delete(id);
}

export async function hideRedistributionRecord(id: string) {
  await verifyAuth();
  return await redistributionRecordService.hide(id);
}

export async function unhideRedistributionRecord(id: string) {
  await verifyAuth();
  return await redistributionRecordService.unhide(id);
}

export async function getIncomingDonations() {
  await verifyAuth();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('donations')
    .select('*')
    .order('createdAt', { ascending: false });
    
  if (error) {
    console.error('Error fetching donations:', error);
    return [];
  }
  return data || [];
}

export async function updateDonationPublicName(id: string, publicName: string | null) {
  await verifyAuth();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('donations')
    .update({ publicName })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating public name:', error);
    throw new Error('Failed to update public name');
  }
  return data;
}