'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Post } from '@/lib/types';
import { PERSONA_BLOG_THEMES } from './themes';
import { formatDate } from '@/lib/utils';

export interface FeaturedPostProps {
  post: Post;
  persona: 'main' | 'wanderer' | 'thinker' | 'builder' | 'operator';
}

export function FeaturedPost({ post, persona }: FeaturedPostProps) {
  const theme = PERSONA_BLOG_THEMES[persona] || PERSONA_BLOG_THEMES.wanderer;
  const [coverFailed, setCoverFailed] = useState(false);

  const isOperator = persona === 'operator';

  // Adaptive background colors
  const getBannerBgBorder = () => {
    switch (persona) {
      case 'operator':
      case 'builder':
      case 'thinker':
      case 'wanderer':
      case 'main':
      default:
        return 'bg-background border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      className={`group relative w-full overflow-hidden border rounded-xl shadow-2xl flex flex-col-reverse lg:grid lg:grid-cols-12 min-h-95 ${getBannerBgBorder()}`}
      id="unified-hero-banner"
    >
      {/* Dynamic blurred image backdrop that covers the entire banner for a cohesive editorial style */}
      <div className="absolute inset-0 overflow-hidden rounded-xl z-0 pointer-events-none select-none">
        {(!coverFailed && post.coverImageUrl) ? (
          <Image
            src={post.coverImageUrl || ""}
            alt=""
            fill
            referrerPolicy="no-referrer"
            priority
            onError={() => setCoverFailed(true)}
            className="object-cover w-full h-full opacity-55 scale-125 saturate-130 brightness-50"
            style={{ filter: 'blur(80px)' }}
          />
        ) : (
          <div className="w-full h-full bg-muted opacity-55 scale-125 saturate-130 brightness-50" />
        )}
        {/* Gradients ensuring perfect contrast on text and balancing the photo light */}
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/65 to-transparent lg:block hidden z-10" />
        <div className="absolute inset-y-0 right-0 w-2/5 bg-linear-to-l from-black/45 via-black/10 to-transparent lg:block hidden z-10" />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/55 to-black/90 lg:hidden block z-10" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        #hero-image-sharp-transition {
          mask-image: linear-gradient(to bottom, black 65%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 65%, transparent 100%);
        }
        @media (min-width: 1024px) {
          #hero-image-sharp-transition {
            mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.95) 30%, black 100%);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.95) 30%, black 100%);
          }
        }
      `}} />

      {/* LEFT COMPONENT: INTENTIONAL TEXT & CALL TO ACTION */}
      <div className="relative z-20 lg:col-span-5 flex flex-col justify-between p-5 sm:p-10 lg:p-12 space-y-5">
        <div className="space-y-3 sm:space-y-4">
          <span
            id="hero-banner-eyebrow"
            className={`font-mono text-[9px] uppercase tracking-[0.35em] block font-bold opacity-90 ${theme.accentColor}`}
          >
            FEATURED DISPATCH
          </span>

          <Link href={`/p/${post.slug}`}>
            <h2
              id="hero-banner-title"
              className={`text-2xl sm:text-4xl lg:text-4.5xl text-foreground tracking-tight leading-[1.15] hover:opacity-95 transition-opacity ${theme.titleFont}`}
            >
              {post.title}
            </h2>
          </Link>

          <p
            id="hero-banner-excerpt"
            className="text-[13.5px] sm:text-[15px] font-sans leading-relaxed text-primary/80 font-light"
            style={{ fontFamily: isOperator ? 'var(--font-mono)' : 'inherit' }}
          >
            {post.excerpt || post.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 sm:pt-4">
          {/* Round Arrow Button & Text label */}
          <Link
            href={`/p/${post.slug}`}
            className="flex items-center gap-3 select-none"
            id="hero-read-latest-btn"
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-transform group-hover:scale-[1.03] bg-muted border-border text-primary`}>
              <span className="text-sm sm:text-base">→</span>
            </div>
            <span className={`font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold ${theme.accentColor}`}>
              {theme.readBtnText || 'READ DISPATCH'}
            </span>
          </Link>

          <span className="font-mono text-[9px] sm:text-[9.5px] uppercase tracking-wider text-primary/60">
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
        </div>
      </div>

      {/* RIGHT COMPONENT: COVER OUTDOOR PHOTOGRAPHY WITH GRADIENT BLEND */}
      <div id="hero-image-sharp-transition" className="relative lg:col-span-7 h-45 sm:h-65 lg:h-auto overflow-hidden z-10">
        {(!coverFailed && post.coverImageUrl) ? (
          <Image
            src={post.coverImageUrl || ""}
            alt={post.title}
            fill
            priority
            referrerPolicy="no-referrer"
            onError={() => setCoverFailed(true)}
            className="object-cover object-center w-full h-full filter saturate-92 brightness-85"
            sizes="(max-w-1024px) 100vw, 750px"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>
    </motion.div>
  );
}

export default FeaturedPost;
