'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { ThoughtFragmentService } from '@/lib/services/thoughtFragment.service';
import { thoughtFragmentSchema } from '@/lib/schemas';

const thoughtFragmentService = new ThoughtFragmentService();

export async function getThoughtFragments() {
  await verifyAuth();
  return await thoughtFragmentService.getAll();
}

export async function getThoughtFragmentById(id: string) {
  await verifyAuth();
  return await thoughtFragmentService.getById(id);
}

export async function createThoughtFragment(data: any) {
  await verifyAuth();
  const validData = thoughtFragmentSchema.parse(data);
  return await thoughtFragmentService.create(validData as any);
}

export async function updateThoughtFragment(id: string, data: any) {
  await verifyAuth();
  const validData = thoughtFragmentSchema.parse(data);
  return await thoughtFragmentService.update(id, validData as any);
}

export async function deleteThoughtFragment(id: string) {
  await verifyAuth();
  return await thoughtFragmentService.delete(id);
}

export async function hideThoughtFragment(id: string) {
  await verifyAuth();
  return await thoughtFragmentService.hide(id);
}

export async function unhideThoughtFragment(id: string) {
  await verifyAuth();
  return await thoughtFragmentService.unhide(id);
}


export async function moveThoughtFragmentUp(id: string) {
  await verifyAuth();
  return await thoughtFragmentService.moveUp(id);
}

export async function moveThoughtFragmentDown(id: string) {
  await verifyAuth();
  return await thoughtFragmentService.moveDown(id);
}