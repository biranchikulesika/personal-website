import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPersonaUrl(persona: 'builder' | 'operator' | 'wanderer' | 'thinker' | 'main', path: string = '') {
  // If we're deployed on the actual domain, use subdomains
  const useSubdomains = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === 'true';
  const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'biranchikulesika.com';
  const isDev = process.env.NODE_ENV === 'development';

  if (useSubdomains && !isDev) {
    if (persona === 'main') {
      return `https://${baseDomain}${path}`;
    }
    return `https://${persona}.${baseDomain}${path}`;
  }

  if (persona === 'main') {
    return path || '/';
  }
  return `/${persona}${path}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}, ${d.getFullYear()}`;
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except hyphens
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}
