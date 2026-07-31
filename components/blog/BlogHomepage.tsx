'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen } from 'lucide-react';

import { Post } from '@/lib/types';
import { PERSONA_BLOG_THEMES } from './themes';
import { FeaturedPost } from './FeaturedPost';
import { Search } from './Search';
import { getPersonaUrl } from '@/lib/utils';

export interface BlogHomepageProps {
  persona: 'main' | 'wanderer' | 'thinker' | 'builder' | 'operator';
  databasePosts: any[];
}

export function BlogHomepage({ persona, databasePosts }: BlogHomepageProps) {
  const theme = PERSONA_BLOG_THEMES[persona] || PERSONA_BLOG_THEMES.wanderer;
  const [posts, setPosts] = useState<any[]>([]);

  // Interactive UI states for the Substack-style feed
  const [activeTab, setActiveTab] = useState<string>(persona === 'main' ? 'all' : 'latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(12);
  const [brokenImages, setBrokenImages] = useState<Record<string, true>>({});

  // Responsive limit handler for mobile & desktop view constraints
  useEffect(() => {
    const updateLimit = () => {
      if (window.innerWidth < 640) {
        setDisplayLimit(6); // Mobile: 6 posts max
      } else if (window.innerWidth >= 1024) {
        setDisplayLimit(12); // Desktop: 3 cols * 4 rows = 12 posts max
      } else {
        setDisplayLimit(8); // Tablet: 2 cols * 4 rows = 8 posts max
      }
    };
    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, []);

  useEffect(() => {
    // Collect static database posts and filter out hidden + draft posts
    const dbPosts = persona === 'main'
      ? databasePosts.filter(p => !p.hidden && p.draft !== true && (!p.status || p.status.toLowerCase() !== 'draft'))
      : databasePosts.filter(p => p.persona === persona && !p.hidden && p.draft !== true && (!p.status || p.status.toLowerCase() !== 'draft'));

    setTimeout(() => {
      setPosts(dbPosts);
    }, 0);
  }, [persona, databasePosts]);

  // Memoize derived data to avoid re-computation on every render
  const sortedPosts = useMemo(() => 
    [...posts].sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()),
    [posts]
  );

  const featured = useMemo(() => 
    sortedPosts.find(p => p.featured) || sortedPosts[0],
    [sortedPosts]
  );

  const remainingPosts = useMemo(() => 
    sortedPosts.filter(p => p.slug !== featured?.slug),
    [sortedPosts, featured?.slug]
  );

  const popularPosts = useMemo(() => 
    remainingPosts.slice(0, 4),
    [remainingPosts]
  );

  // The stream / list feed (all posts, excluding the featured banner, filtered by searchQuery and tab)
  const feedPosts = useMemo(() => 
    remainingPosts.filter(p => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.persona?.toLowerCase().includes(q)
        );
      }
      if (persona === 'main') {
        if (activeTab === 'all') return true;
        return p.persona === activeTab;
      } else {
        if (activeTab === 'top') {
          return remainingPosts.slice(0, 4).map(post => post.slug).includes(p.slug);
        }
        return true;
      }
    }),
    [remainingPosts, searchQuery, persona, activeTab]
  );

  const archiveUrl = getPersonaUrl(persona, '/blogs/archive');

  const handleSubscribe = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmail('');
    }
  }, [email]);

  return (
    <div className={`w-full min-h-screen ${theme.containerClass}`}>
      {/* Dynamic Substack Navigation and Masthead Space */}
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">

        {/* 1. HERO BANNER */}
        {featured && (
          <section id="substack-hero-section">
            <FeaturedPost post={featured} persona={persona === 'main' ? featured.persona : persona} />
          </section>
        )}

        {/* 2. MOST POPULAR ROW */}
        {popularPosts.length > 0 && (
          <section id="substack-popular-section" className="hidden md:block space-y-6 pt-4">
            <div className={`flex items-center justify-between border-b pb-2 ${theme.borderColor}`}>
              <h2 className={`text-xs uppercase tracking-[0.2em] font-bold ${
                persona === 'operator' ? 'font-mono text-primary' : 'font-sans opacity-70'
              }`}>
                {theme.stripTitle}
              </h2>
              <Link
                href={archiveUrl}
                className={`text-[10px] sm:text-[10.5px] uppercase tracking-wider font-bold transition-colors ${theme.accentColor} ${theme.hoverColor}`}
              >
                {theme.stripLinkText} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  {popularPosts.map((post) => {
                    const postImage = post.heroImage || post.coverImageUrl || post.coverImage;
                    return (
                      <div
                        key={post.slug}
                        className={`flex gap-4 items-start justify-between border-b sm:border-b-0 pb-4 sm:pb-0 sm:border-r last:border-0 pr-0 sm:pr-4 lg:pr-6 ${theme.borderColor}`}
                      >
                        <div className="space-y-2">
                          <Link href={`/p/${post.slug}`}>
                            <h3 className={`text-[14.5px] font-bold leading-snug line-clamp-2 hover:opacity-80 transition-opacity ${theme.titleFont} ${theme.primaryColor}`}>
                              {post.title}
                            </h3>
                          </Link>
                          <div className="text-[9.5px] font-mono uppercase tracking-wider opacity-50">
                            {post.publishedAt || post.createdAt}
                          </div>
                        </div>                          {!brokenImages[post.slug] && postImage && (
                            <div className={`w-14 h-14 relative rounded-md overflow-hidden shrink-0 bg-muted border ${theme.borderColor}`}>
                            <Image
                              src={postImage}
                              fill
                              className="object-cover saturate-85 filter"
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              onError={() => setBrokenImages(prev => ({ ...prev, [post.slug]: true }))}
                              sizes="60px"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          </section>
        )}

        <div className={`hidden md:block border-t my-8 ${theme.borderColor}`} />

        {/* 3. TABS BAR & SEARCH BOX */}
        <section className="space-y-6">
          <div className={`flex items-center justify-between border-b pb-1.5 select-none gap-4 ${theme.borderColor}`}>
            {!mobileSearchOpen ? (
              <>
                {/* Category selector loops */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 font-sans text-xs uppercase tracking-wider font-bold text-muted-text">
                  {persona === 'main' ? (
                    <>
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-2 transition-colors relative ${activeTab === 'all' ? 'text-heading border-b-2 border-stone-500' : 'hover:text-heading/70'}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setActiveTab('builder')}
                        className={`pb-2 transition-colors relative ${activeTab === 'builder' ? 'text-heading border-b-2 border-primary' : 'hover:text-heading/70'}`}
                      >
                        Forge
                      </button>
                      <button
                        onClick={() => setActiveTab('operator')}
                        className={`pb-2 transition-colors relative ${activeTab === 'operator' ? 'text-heading border-b-2 border-primary' : 'hover:text-heading/70'}`}
                      >
                        Signal
                      </button>
                      <button
                        onClick={() => setActiveTab('wanderer')}
                        className={`pb-2 transition-colors relative ${activeTab === 'wanderer' ? 'text-heading border-b-2 border-primary' : 'hover:text-heading/70'}`}
                      >
                        Scribble
                      </button>
                      <button
                        onClick={() => setActiveTab('thinker')}
                        className={`pb-2 transition-colors relative ${activeTab === 'thinker' ? 'text-heading border-b-2 border-primary' : 'hover:text-heading/70'}`}
                      >
                        Inside The Head
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveTab('latest')}
                        className={`pb-2 transition-colors relative ${
                          activeTab === 'latest'
                            ? `text-heading border-b-2 border-primary`
                            : 'hover:text-heading/70'
                        }`}
                      >
                        Latest
                      </button>
                      <button
                        onClick={() => setActiveTab('top')}
                        className={`pb-2 transition-colors relative ${
                          activeTab === 'top'
                            ? `text-heading border-b-2 border-primary`
                            : 'hover:text-heading/70'
                        }`}
                      >
                        Popular
                      </button>
                    </>
                  )}
                </div>

                {/* Desktop & Tablet Search Box aligning perfectly on the right side */}
                <div className="hidden sm:block sm:min-w-70 lg:min-w-[320px]">
                  <Search value={searchQuery} onChange={setSearchQuery} persona={persona === 'main' ? 'wanderer' : persona} />
                </div>

                {/* Compact Mobile Search Toggle Icon */}
                <button
                  onClick={() => {
                    setMobileSearchOpen(true);
                    if (persona === 'main') setActiveTab('all');
                    else setActiveTab('latest');
                  }}
                  className="sm:hidden p-2 text-muted-text hover:text-heading transition-colors"
                  aria-label="Search dispatches"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full flex items-center gap-3 sm:hidden pb-1"
              >
                <div className="flex-1">
                  <Search value={searchQuery} onChange={setSearchQuery} persona={persona === 'main' ? 'wanderer' : persona} />
                </div>
                <button
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className={`p-1 text-xs uppercase tracking-wider font-sans font-bold shrink-0 ${theme.accentColor}`}
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </div>

          {/* 4. MAIN BODY COLUMN & SIDEBAR SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pt-4">

            {/* PRIMARY PUBLICATIONS FEED STREAM (Cols 1 to 9 on big screens) */}
            <div className="lg:col-span-9 space-y-12">
              {feedPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                  {feedPosts.slice(0, displayLimit).map((post, idx) => {
                    const postCardImage = post.heroImage || post.coverImageUrl || post.coverImage;
                    return (
                      <motion.article
                        key={post.slug}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.4) }}
                        className={`group flex flex-col justify-between space-y-4 border-b pb-6 last:border-b-0 ${theme.borderColor}`}
                      >
                        <div className="space-y-3.5">
                          {/* Card Thumbnail */}
                          {(!brokenImages[post.slug] && postCardImage) ? (
                            <Link href={`/p/${post.slug}`} className={`block relative aspect-[1.5] w-full overflow-hidden bg-muted border rounded-lg ${theme.borderColor}`}>
                              <Image
                                src={postCardImage}
                                alt={post.title}
                                fill
                                referrerPolicy="no-referrer"
                                onError={() => setBrokenImages(prev => ({ ...prev, [post.slug]: true }))}
                                className="object-cover saturate-85"
                                sizes="(max-w-768px) 100vw, 360px"
                                loading="lazy"
                              />
                            </Link>
                          ) : (
                            <div className={`aspect-[1.5] w-full border border-dashed rounded-lg flex items-center justify-center ${theme.borderColor} bg-muted/50`}>
                              <span className="text-[10px] text-muted-text italic">No cover</span>
                            </div>
                          )}

                        <div className="space-y-2">
                          {/* Metadata */}
                          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-text flex flex-wrap items-center gap-1.5">
                            <span>{post.publishedAt || post.createdAt}</span>
                            <span>•</span>
                            <span className={theme.accentColor}>{post.category}</span>
                            {persona === 'main' && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.5 text-[8px] tracking-wider rounded bg-muted border border-border-subtle text-muted-text">
                                  {post.persona === 'builder' ? 'Forge' : post.persona === 'operator' ? 'Signal' : post.persona === 'wanderer' ? 'Scribble' : 'Inside The Head'}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Title */}
                          <Link href={`/p/${post.slug}`}>
                            <h3 className={`text-[18.2px] font-bold tracking-tight leading-snug line-clamp-2 ${theme.titleFont} ${theme.primaryColor} hover:opacity-85 duration-300`}>
                              {post.title}
                            </h3>
                          </Link>

                          {/* Excerpt */}
                          <Link href={`/p/${post.slug}`} className="block">
                            <p className="text-[14px] leading-relaxed opacity-75 font-light line-clamp-3 mt-1" style={{ fontFamily: persona === 'operator' ? 'var(--font-mono)' : 'inherit' }}>
                              {post.excerpt || post.subtitle}
                            </p>
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                    );
                  })}
                </div>
              ) : (
                <div className={`py-20 text-center border border-dashed rounded-xl flex flex-col items-center justify-center gap-3 ${theme.borderColor}`}>
                  <span className="font-mono text-xs text-muted-text font-medium select-none">
                    {searchQuery ? 'No results found.' : 'No posts yet.'}
                  </span>
                </div>
              )}

              {/* VIEW COMPLETE FEED LINK */}
              <div className={`pt-8 select-none border-t flex justify-center sm:justify-start ${theme.borderColor}`}>
                <Link
                  href={archiveUrl}
                  className={`group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest hover:underline ${theme.accentColor} ${theme.hoverColor}`}
                  id="substack-feed-link-footer"
                >
                  <span>{theme.seeAllText}</span>
                  <span className="font-sans inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>

            {/* SECONDARY SIDEBAR COLUMN: PROFILE & EMAIL FORM (Cols 10 to 12) */}
            <div className={`lg:col-span-3 space-y-8 select-none lg:border-l lg:pl-10 ${theme.borderColor}`}>
              <div className="sticky top-28 space-y-8">

                <div className="space-y-4 pt-2">
                  <span className={`text-[10px] uppercase font-mono tracking-wider font-bold block ${theme.accentColor}`}>
                    NEWSLETTER
                  </span>
                  <h5 className={`text-base font-bold leading-tight ${theme.titleFont} ${theme.primaryColor}`}>
                    Dispatches in your inbox.
                  </h5>

                  <form onSubmit={handleSubscribe} className="space-y-3 pt-1">
                    <input
                      type="email"
                      placeholder="Type your email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full border rounded-md px-3 py-2.5 text-xs text-foreground font-sans ${
                        persona === 'operator'
                          ? 'font-mono border-dashed bg-muted placeholder:text-primary/50 focus:border-primary border-border focus:border-solid rounded-none'
                          : persona === 'builder'
                          ? 'font-mono bg-muted/50 placeholder:text-primary/50 focus:border-primary border-border focus:ring-1 focus:ring-primary/10'
                          : persona === 'thinker'
                          ? 'border-0 border-b bg-transparent rounded-none px-1 placeholder:text-primary/50 focus:border-primary border-border'
                          : 'bg-muted border-border placeholder:text-primary/50 focus:border-primary'
                      } outline-none transition-colors`}
                    />
                      <button
                        type="submit"
                        className={`w-full py-2.5 text-white text-xs font-bold uppercase tracking-widest font-sans transition-all duration-300 shadow-sm ${
                          persona === 'builder'
                            ? 'bg-orange-500 hover:bg-orange-600 rounded-md hover:shadow-orange-500/10'
                            : persona === 'operator'
                            ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 rounded-none'
                            : persona === 'thinker'
                            ? 'bg-muted-foreground hover:opacity-80 rounded-full border border-border'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md'
                        }`}
                      >
                        Subscribe
                      </button>
                  </form>

                  {subscribed && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] font-sans text-emerald-500 font-medium leading-normal"
                    >
                      ✓ Subscription recorded!
                    </motion.p>
                  )}
                </div>

              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

export default BlogHomepage;
