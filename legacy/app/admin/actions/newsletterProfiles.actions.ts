'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { NewsletterProfileService } from '@/lib/services/newsletterProfile.service';
import { newsletterProfileSchema } from '@/lib/schemas';

const newsletterProfileService = new NewsletterProfileService();

export async function getNewsletterProfiles() {
  await verifyAuth();
  return await newsletterProfileService.getAll();
}

export async function getNewsletterProfileById(id: string) {
  await verifyAuth();
  return await newsletterProfileService.getById(id);
}

export async function createNewsletterProfile(data: any) {
  await verifyAuth();
  const validData = newsletterProfileSchema.parse(data);
  return await newsletterProfileService.create(validData as any);
}

export async function updateNewsletterProfile(id: string, data: any) {
  await verifyAuth();
  const validData = newsletterProfileSchema.parse(data);
  return await newsletterProfileService.update(id, validData as any);
}

export async function deleteNewsletterProfile(id: string) {
  await verifyAuth();
  return await newsletterProfileService.delete(id);
}

export async function hideNewsletterProfile(id: string) {
  await verifyAuth();
  return await newsletterProfileService.hide(id);
}

export async function unhideNewsletterProfile(id: string) {
  await verifyAuth();
  return await newsletterProfileService.unhide(id);
}