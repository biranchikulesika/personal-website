'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { FieldNoteService } from '@/lib/services/fieldNote.service';
import { fieldNoteSchema } from '@/lib/schemas';

const fieldNoteService = new FieldNoteService();

export async function getFieldNotes() {
  await verifyAuth();
  return await fieldNoteService.getAll();
}

export async function getFieldNoteById(id: string) {
  await verifyAuth();
  return await fieldNoteService.getById(id);
}

export async function createFieldNote(data: any) {
  await verifyAuth();
  const validData = fieldNoteSchema.parse(data);
  return await fieldNoteService.create(validData as any);
}

export async function updateFieldNote(id: string, data: any) {
  await verifyAuth();
  const validData = fieldNoteSchema.parse(data);
  return await fieldNoteService.update(id, validData as any);
}

export async function deleteFieldNote(id: string) {
  await verifyAuth();
  return await fieldNoteService.delete(id);
}

export async function hideFieldNote(id: string) {
  await verifyAuth();
  return await fieldNoteService.hide(id);
}

export async function unhideFieldNote(id: string) {
  await verifyAuth();
  return await fieldNoteService.unhide(id);
}

export async function featureFieldNote(id: string) {
  await verifyAuth();
  return await fieldNoteService.feature(id);
}

export async function unfeatureFieldNote(id: string) {
  await verifyAuth();
  return await fieldNoteService.unfeature(id);
}