'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { BuilderStatusService } from '@/lib/services/builderStatus.service';
import { builderStatusSchema } from '@/lib/schemas';

const builderStatusService = new BuilderStatusService();

export async function getBuilderStatuss() {
  await verifyAuth();
  return await builderStatusService.getAll();
}

export async function getBuilderStatusById(id: string) {
  await verifyAuth();
  return await builderStatusService.getById(id);
}

export async function createBuilderStatus(data: any) {
  await verifyAuth();
  const validData = builderStatusSchema.parse(data);
  return await builderStatusService.create(validData as any);
}

export async function updateBuilderStatus(id: string, data: any) {
  await verifyAuth();
  const validData = builderStatusSchema.parse(data);
  return await builderStatusService.update(id, validData as any);
}

export async function deleteBuilderStatus(id: string) {
  await verifyAuth();
  return await builderStatusService.delete(id);
}

export async function hideBuilderStatus(id: string) {
  await verifyAuth();
  return await builderStatusService.hide(id);
}

export async function unhideBuilderStatus(id: string) {
  await verifyAuth();
  return await builderStatusService.unhide(id);
}