'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { subscriptionService } from '@/lib/services/subscription.service';
import { subscriptionSchema } from '@/lib/schemas';

export async function getSubscriptions() {
  await verifyAuth();
  return await subscriptionService.getAll();
}

export async function getSubscription(id: string) {
  await verifyAuth();
  return await subscriptionService.getById(id);
}

export async function saveSubscription(id: string | null, data: any) {
  await verifyAuth();
  const validData = subscriptionSchema.parse(data);
  if (id) {
    return await subscriptionService.update(id, validData as any);
  }
  return await subscriptionService.create(validData as any);
}

export async function deleteSubscription(id: string) {
  await verifyAuth();
  return await subscriptionService.delete(id);
}