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

export function MarkdownRenderer({ content }: { content: string }) {
  // Legacy support for pure markdown if needed, but PostRenderer will handle MDX properly.
  // This acts as a fallback for uncompiled MDX (e.g. while preview is loading)
  return <div className="whitespace-pre-wrap font-mono text-sm text-neutral-400 p-4">{content}</div>;
}
