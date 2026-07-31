'use server';
import { verifyAuth } from '@/lib/auth/verify';
import { NewsletterIssueService } from '@/lib/services/newsletterIssue.service';
import { newsletterIssueSchema } from '@/lib/schemas';

const newsletterIssueService = new NewsletterIssueService();

export async function getNewsletterIssues() {
  await verifyAuth();
  return await newsletterIssueService.getAll();
}

export async function getNewsletterIssueById(id: string) {
  await verifyAuth();
  return await newsletterIssueService.getById(id);
}

export async function createNewsletterIssue(data: any) {
  await verifyAuth();
  const validData = newsletterIssueSchema.parse(data);
  return await newsletterIssueService.create(validData as any);
}

export async function updateNewsletterIssue(id: string, data: any) {
  await verifyAuth();
  const validData = newsletterIssueSchema.parse(data);
  return await newsletterIssueService.update(id, validData as any);
}

export async function deleteNewsletterIssue(id: string) {
  await verifyAuth();
  return await newsletterIssueService.delete(id);
}

export async function hideNewsletterIssue(id: string) {
  await verifyAuth();
  return await newsletterIssueService.hide(id);
}

export async function unhideNewsletterIssue(id: string) {
  await verifyAuth();
  return await newsletterIssueService.unhide(id);
}