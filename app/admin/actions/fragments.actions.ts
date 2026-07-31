'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { FragmentService } from '@/lib/services/fragment.service';
import { fragmentSchema } from '@/lib/schemas';

const fragmentService = new FragmentService();

export async function getFragments() {
  await verifyAuth();
  return await fragmentService.getAll();
}

export async function getFragmentById(id: string) {
  await verifyAuth();
  return await fragmentService.getById(id);
}

export async function createFragment(data: any) {
  await verifyAuth();
  const validData = fragmentSchema.parse(data);
  return await fragmentService.create(validData as any);
}

export async function updateFragment(id: string, data: any) {
  await verifyAuth();
  const validData = fragmentSchema.parse(data);
  return await fragmentService.update(id, validData as any);
}

export async function deleteFragment(id: string) {
  await verifyAuth();
  return await fragmentService.delete(id);
}

export async function hideFragment(id: string) {
  await verifyAuth();
  return await fragmentService.hide(id);
}

export async function unhideFragment(id: string) {
  await verifyAuth();
  return await fragmentService.unhide(id);
}


export async function moveFragmentUp(id: string) {
  await verifyAuth();
  return await fragmentService.moveUp(id);
}

export async function moveFragmentDown(id: string) {
  await verifyAuth();
  return await fragmentService.moveDown(id);
}