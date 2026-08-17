'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { RedistributionRecordService } from '@/lib/services/redistributionRecord.service';
import { redistributionRecordSchema } from '@/lib/schemas';

import { DonationService } from '@/lib/services/donation.service';

const redistributionRecordService = new RedistributionRecordService();
const donationService = new DonationService();

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

  // Auto-prune pending donations initiated by users that were never completed and are older than 1 month (30 days)
  try {
    await donationService.deleteExpiredPending(30);
  } catch (err) {
    console.error('Auto-prune of expired pending donations error:', err);
  }

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

export async function deleteExpiredPendingDonationsAction(olderThanDays = 30) {
  await verifyAuth();
  const deletedCount = await donationService.deleteExpiredPending(olderThanDays);
  return { success: true, deletedCount };
}

export async function deleteDonationRecordAction(id: string) {
  await verifyAuth();
  await donationService.delete(id);
  return { success: true };
}