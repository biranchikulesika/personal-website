'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

import { Post } from '@/lib/types';
import { PERSONA_BLOG_THEMES } from './themes';
import { Search } from './Search';
import { ArchiveTimeline } from './ArchiveTimeline';
import { useDebounce } from '@/hooks/use-debounce';

export interface ArchivePageProps {
  persona: 'main' | 'wanderer' | 'thinker' | 'builder' | 'operator';
  databasePosts: any[];
  initialSearchQuery?: string;
}

export function ArchivePage({ persona, databasePosts, initialSearchQuery = '' }: ArchivePageProps) {
  const theme = PERSONA_BLOG_THEMES[persona] || PERSONA_BLOG_THEMES.wanderer;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    // Collect static database posts and filter out hidden + draft posts
    const dbPosts = persona === 'main'
      ? databasePosts.filter(p => !p.hidden && p.draft !== true && (!p.status || p.status.toLowerCase() !== 'draft'))
      : databasePosts.filter(p => p.persona === persona && !p.hidden && p.draft !== true && (!p.status || p.status.toLowerCase() !== 'draft'));

    setPosts(dbPosts);
  }, [persona, databasePosts]);

  // Debounce search query to URL. searchParams is read from the live URL at
  // call time (window.location) rather than subscribed to via useSearchParams:
  // the hook returns a new object reference after every router.replace(), so
  // including it in the deps would re-trigger this effect into an infinite loop.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentQ = params.get('q') || '';
    if (debouncedSearchQuery !== currentQ) {
      if (debouncedSearchQuery) {
        params.set('q', debouncedSearchQuery);
      } else {
        params.delete('q');
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }
  }, [debouncedSearchQuery, pathname, router]);

  return (
    <div className={`w-full min-h-screen ${theme.containerClass}`}>
      <div className="mx-auto px-6 sm:px-10 lg:px-14 pt-6 pb-12 lg:pt-8 lg:pb-16 space-y-6 lg:max-w-5xl sm:max-w-6xl">

        {/* Minimal Timeline Archive Header */}
        <header className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 select-none border-b w-full ${theme.borderColor}`}>
          <div className="space-y-1">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme.titleFont} ${theme.primaryColor}`}>
              {theme.archiveTitle}
            </h1>
            <p className="text-xs opacity-65 font-light">
              {theme.archiveSubtitle}
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-70 lg:min-w-[320px]">
            <Search value={searchQuery} onChange={setSearchQuery} persona={persona === 'main' ? 'wanderer' : persona} />
          </div>
        </header>

        {/* CHRONOLOGICAL TIMELINE */}
        <section id="archive-chronological-feed" className="py-6 select-text relative">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-background/50 backdrop-blur-[1px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          <AnimatePresence mode="wait">
            {posts.length > 0 ? (
              <ArchiveTimeline posts={posts} persona={persona} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`py-16 text-center flex flex-col justify-center items-center gap-4 border border-dashed rounded ${theme.borderColor}`}
              >
                <div className="font-mono text-xs text-muted-text uppercase tracking-widest leading-loose">
                  No results found
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className={`font-mono text-[10px] uppercase hover:underline ${theme.accentColor}`}
                >
                  Clear search
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>
    </div>
  );
}

export default ArchivePage;
