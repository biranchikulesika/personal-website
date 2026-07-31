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

  // Fallback to path-based routing for local dev / preview
  if (persona === 'main') {
    return path || '/';
  }
  return `/${persona}${path}`;
}
