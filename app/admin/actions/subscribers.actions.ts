'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { subscriberService } from '@/lib/services/subscriber.service';
import { subscriberSchema } from '@/lib/schemas';

export async function getSubscribers() {
  await verifyAuth();
  return await subscriberService.getAll();
}

export async function getSubscriber(id: string) {
  await verifyAuth();
  return await subscriberService.getById(id);
}

export async function saveSubscriber(id: string | null, data: any) {
  await verifyAuth();
  const validData = subscriberSchema.parse(data);
  if (id) {
    return await subscriberService.update(id, validData as any);
  }
  return await subscriberService.create(validData as any);
}

export async function deleteSubscriber(id: string) {
  await verifyAuth();
  return await subscriberService.delete(id);
}