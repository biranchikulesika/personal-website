'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { JournalMomentService } from '@/lib/services/journalMoment.service';
import { journalMomentSchema } from '@/lib/schemas';

const journalMomentService = new JournalMomentService();

export async function getJournalMoments() {
  await verifyAuth();
  return await journalMomentService.getAll();
}

export async function getJournalMomentById(id: string) {
  await verifyAuth();
  return await journalMomentService.getById(id);
}

export async function createJournalMoment(data: any) {
  await verifyAuth();
  const validData = journalMomentSchema.parse(data);
  return await journalMomentService.create(validData as any);
}

export async function updateJournalMoment(id: string, data: any) {
  await verifyAuth();
  const validData = journalMomentSchema.parse(data);
  return await journalMomentService.update(id, validData as any);
}

export async function deleteJournalMoment(id: string) {
  await verifyAuth();
  return await journalMomentService.delete(id);
}

export async function hideJournalMoment(id: string) {
  await verifyAuth();
  return await journalMomentService.hide(id);
}

export async function unhideJournalMoment(id: string) {
  await verifyAuth();
  return await journalMomentService.unhide(id);
}