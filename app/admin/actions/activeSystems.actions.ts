'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { ActiveSystemService } from '@/lib/services/activeSystem.service';
import { activeSystemSchema } from '@/lib/schemas';

const activeSystemService = new ActiveSystemService();

export async function getActiveSystems() {
  await verifyAuth();
  return await activeSystemService.getAll();
}

export async function getActiveSystemById(id: string) {
  await verifyAuth();
  return await activeSystemService.getById(id);
}

export async function createActiveSystem(data: any) {
  await verifyAuth();
  const validData = activeSystemSchema.parse(data);
  return await activeSystemService.create(validData as any);
}

export async function updateActiveSystem(id: string, data: any) {
  await verifyAuth();
  const validData = activeSystemSchema.parse(data);
  return await activeSystemService.update(id, validData as any);
}

export async function deleteActiveSystem(id: string) {
  await verifyAuth();
  return await activeSystemService.delete(id);
}

export async function hideActiveSystem(id: string) {
  await verifyAuth();
  return await activeSystemService.hide(id);
}

export async function unhideActiveSystem(id: string) {
  await verifyAuth();
  return await activeSystemService.unhide(id);
}


export async function moveActiveSystemUp(id: string) {
  await verifyAuth();
  return await activeSystemService.moveUp(id);
}

export async function moveActiveSystemDown(id: string) {
  await verifyAuth();
  return await activeSystemService.moveDown(id);
}


export async function reorderActiveSystems(ids: string[]) {
  await verifyAuth();
  return await activeSystemService.reorder(ids);
}