'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Post } from '@/lib/types';
import { PERSONA_BLOG_THEMES } from './themes';

export interface ArticleGridProps {
  posts: Post[];
  persona: 'wanderer' | 'thinker' | 'builder' | 'operator';
}

export function ArticleGrid({ posts, persona }: ArticleGridProps) {
  const theme = PERSONA_BLOG_THEMES[persona] || PERSONA_BLOG_THEMES.wanderer;
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const isOperator = persona === 'operator';
  const isWanderer = persona === 'wanderer';

  if (!posts || posts.length === 0) {
    return (
      <div className="py-12 text-center text-muted-text font-mono text-xs">
        No posts yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12" id="articles-editorial-grid">
      {posts.map((post, idx) => (
        <motion.article
          key={post.slug}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
          className="group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            {/* Post Thumbnail */}
            <Link href={`/p/${post.slug}`} className="block">
              {(post.coverImageUrl && !failedImages[post.slug]) ? (
                <div className={`relative aspect-3/2 w-full overflow-hidden border bg-neutral-900/10 ${
                  isOperator ? 'rounded-none' : 'rounded-[1.5px]'
                } ${theme.borderColor}`}>
                  <Image
                    src={post.coverImageUrl || ""}
                    alt={post.title}
                    fill
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages(prev => ({ ...prev, [post.slug]: true }))}
                    className={`object-cover w-full h-full filter duration-700 ease-in-out group-hover:scale-[1.015] ${
                      isOperator
                        ? 'grayscale-35 contrast-110'
                        : 'grayscale-20 contrast-90 sepia-10 saturate-80 brightness-92 dark:brightness-76 group-hover:grayscale-0 group-hover:contrast-100 group-hover:sepia-0 group-hover:saturate-100 group-hover:brightness-100 dark:group-hover:brightness-90'
                    }`}
                    sizes="(max-w-768px) 100vw, 300px"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className={`w-full aspect-3/2 border border-dashed flex flex-col justify-center items-center text-center p-6 ${theme.borderColor}`}>
                  <span className="text-muted-text text-[10px] italic">No cover</span>
                </div>
              )}
            </Link>

            {/* Post Details */}
            <div className="space-y-2">
              {/* Metadata */}
              <div className={`${theme.metaFont} flex flex-wrap items-center gap-2 select-none opacity-80 group-hover:opacity-100 transition-opacity`}>
                <span>{post.publishedAt?.split('T')[0] || post.createdAt?.split('T')[0] || ''}</span>
                <span>•</span>
                <span>{post.readingTime ? `${post.readingTime} min read` : ''}</span>
                {post.coverImageLocation && (
                  <>
                    <span>•</span>
                    <span className="italic">{post.coverImageLocation}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <Link href={`/p/${post.slug}`}>
                <h3 className={`text-xl sm:text-1.5xl tracking-tight leading-snug transition-colors duration-400 group-hover:text-heading ${theme.titleFont}`}>
                  {post.title}
                </h3>
              </Link>

              {/* Excerpt */}
              <p className={`text-[13.5px] sm:text-[14px] leading-relaxed opacity-80 group-hover:opacity-95 line-clamp-3 transition-opacity ${
                isOperator ? 'font-mono text-xs text-primary/90' : 'font-spectral italic text-primary/80'
              }`}>
                {post.excerpt || post.subtitle}
              </p>
            </div>
          </div>

          {/* Quick link action at bottom of each card */}
          <div className="pt-2">
            <Link
              href={`/p/${post.slug}`}
              className={`text-xs uppercase tracking-widest font-mono font-medium inline-flex items-center gap-1.5 border-b border-transparent hover:border-current pb-0.5 transition-all duration-300 ${
                isOperator
                  ? 'text-emerald-500 hover:text-emerald-400'
                  : persona === 'builder'
                  ? 'text-orange-500 hover:text-orange-400'
                  : isWanderer
                  ? 'text-primary'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >                Read <span className="font-sans">→</span>
            </Link>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
