'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { compileMDXAction } from './actions'; 
import PostRenderer from '@/components/post-renderer/PostRenderer';

interface MDXPreviewProps {
  content: string;
  persona?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function MDXPreview({ content, persona = 'builder', title = '', subtitle = '', className = '' }: MDXPreviewProps) {
  const [compiled, setCompiled] = useState<any>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce compilation to avoid spamming the server/action while typing.
  // The `compiled` state is only cleared when content becomes empty, so the
  // previous compiled result stays on screen during recompilation — no flash.
  useEffect(() => {
    if (!content) {
      setCompiled(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCompiling(true);
      setError(null);
      try {
        const result = await compileMDXAction(content);
        if (result.error) {
          setError(result.error);
        } else {
          setCompiled(result.source);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to compile MDX');
      } finally {
        setIsCompiling(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const postMock = {
    title: title || 'Untitled Post',
    subtitle: subtitle || '',
    persona: persona === 'unassigned' ? 'thinker' : persona,
    publishedAt: new Date().toISOString(),
    readingTime: 1,
    content: content,
    slug: 'preview-draft'
  };

  // compiled is non-null → we have a previous result to show during debounce
  const showCompiled = !!compiled;

  return (
    <div className={`relative h-full overflow-hidden rounded-lg bg-background ${className}`}>
      {isCompiling && (
        <div className="absolute top-4 right-4 text-primary z-50 bg-background/50 p-1 rounded-full backdrop-blur-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg font-mono text-sm m-4 z-50 relative">
          Error: {error}
        </div>
      )}

      {showCompiled ? (
        <PostRenderer 
          postOnly 
          post={postMock} 
          slug="preview-draft" 
          allPosts={[]} 
          compiledMdx={compiled} 
        />
      ) : (
        !error && <div className="text-muted-foreground italic font-sans text-sm p-8">Start typing to see preview...</div>
      )}
    </div>
  );
}
