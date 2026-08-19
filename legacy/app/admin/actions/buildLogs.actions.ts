'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { BuildLogService } from '@/lib/services/buildLog.service';
import { buildLogSchema } from '@/lib/schemas';

const buildLogService = new BuildLogService();

export async function getBuildLogs() {
  await verifyAuth();
  return await buildLogService.getAll();
}

export async function getBuildLogById(id: string) {
  await verifyAuth();
  return await buildLogService.getById(id);
}

export async function createBuildLog(data: any) {
  await verifyAuth();
  const validData = buildLogSchema.parse(data);
  return await buildLogService.create(validData as any);
}

export async function updateBuildLog(id: string, data: any) {
  await verifyAuth();
  const validData = buildLogSchema.parse(data);
  return await buildLogService.update(id, validData as any);
}

export async function deleteBuildLog(id: string) {
  await verifyAuth();
  return await buildLogService.delete(id);
}

export async function hideBuildLog(id: string) {
  await verifyAuth();
  return await buildLogService.hide(id);
}

export async function unhideBuildLog(id: string) {
  await verifyAuth();
  return await buildLogService.unhide(id);
}