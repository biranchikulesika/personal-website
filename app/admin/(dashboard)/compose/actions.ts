'use server';

import { compileMDX } from '@/lib/mdx/compile';

export async function compileMDXAction(source: string) {
  try {
    const compiled = await compileMDX(source);
    return { source: compiled };
  } catch (error: any) {
    return { error: error.message || 'Unknown compilation error' };
  }
}
