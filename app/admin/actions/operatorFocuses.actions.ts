'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { OperatorFocusService } from '@/lib/services/operatorFocus.service';
import { operatorFocusSchema } from '@/lib/schemas';

const operatorFocusService = new OperatorFocusService();

export async function getOperatorFocuss() {
  await verifyAuth();
  return await operatorFocusService.getAll();
}

export async function getOperatorFocusById(id: string) {
  await verifyAuth();
  return await operatorFocusService.getById(id);
}

export async function createOperatorFocus(data: any) {
  await verifyAuth();
  const validData = operatorFocusSchema.parse(data);
  return await operatorFocusService.create(validData as any);
}

export async function updateOperatorFocus(id: string, data: any) {
  await verifyAuth();
  const validData = operatorFocusSchema.parse(data);
  return await operatorFocusService.update(id, validData as any);
}

export async function deleteOperatorFocus(id: string) {
  await verifyAuth();
  return await operatorFocusService.delete(id);
}

export async function hideOperatorFocus(id: string) {
  await verifyAuth();
  return await operatorFocusService.hide(id);
}

export async function unhideOperatorFocus(id: string) {
  await verifyAuth();
  return await operatorFocusService.unhide(id);
}


export async function moveOperatorFocusUp(id: string) {
  await verifyAuth();
  return await operatorFocusService.moveUp(id);
}

export async function moveOperatorFocusDown(id: string) {
  await verifyAuth();
  return await operatorFocusService.moveDown(id);
}


export async function reorderOperatorFocuss(ids: string[]) {
  await verifyAuth();
  return await operatorFocusService.reorder(ids);
}