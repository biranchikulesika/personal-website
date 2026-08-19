'use client';

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXComponents } from '@/components/mdx/MDXComponents';

interface MDXRendererProps {
  source: MDXRemoteSerializeResult;
}

export function MDXRenderer({ source }: MDXRendererProps) {
  if (!source) return null;

  return (
    <MDXRemote 
      {...source} 
      components={MDXComponents} 
    />
  );
}

