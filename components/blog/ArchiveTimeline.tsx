'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Post } from '@/lib/types';
import { PERSONA_BLOG_THEMES } from './themes';
import { formatDate } from '@/lib/utils';

export interface ArchiveTimelineProps {
  posts: Post[];
  persona: 'main' | 'wanderer' | 'thinker' | 'builder' | 'operator';
}

interface DateMeta {
  year: string;
  monthName: string;
  monthIndex: number;
  timestamp: number;
}

function parseDateMeta(dateStr: string): DateMeta {
  const cleanStr = dateStr.trim();
  const yearMatch = cleanStr.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '2026';

  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let foundMonthName = 'May';
  let foundMonthIdx = 4; // default May

  for (let i = 0; i < 12; i++) {
    const fullReg = new RegExp(fullMonths[i], 'i');
    const shortReg = new RegExp(shortMonths[i], 'i');
    if (fullReg.test(cleanStr) || shortReg.test(cleanStr)) {
      foundMonthName = fullMonths[i];
      foundMonthIdx = i;
      break;
    }
  }

  const timestamp = new Date(cleanStr).getTime() || 0;

  return { year, monthName: foundMonthName, monthIndex: foundMonthIdx, timestamp };
}

export function ArchiveTimeline({ posts, persona }: ArchiveTimelineProps) {
  const theme = PERSONA_BLOG_THEMES[persona] || PERSONA_BLOG_THEMES.wanderer;
  const [brokenImages, setBrokenImages] = useState<Record<string, true>>({});

  // Hooks must be called before early return
  // Memoize grouping and sorting — runs on potentially large post arrays
  const postsWithMeta = useMemo(() => 
    posts.map(post => ({
      post,
      meta: parseDateMeta(post.publishedAt || post.createdAt || '')
    })),
    [posts]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, Record<string, { monthIndex: number; items: typeof postsWithMeta }>> = {};
    postsWithMeta.forEach(item => {
      const { year, monthName, monthIndex } = item.meta;
      if (!groups[year]) groups[year] = {};
      if (!groups[year][monthName]) groups[year][monthName] = { monthIndex, items: [] };
      groups[year][monthName].items.push(item);
    });
    return groups;
  }, [postsWithMeta]);

  const sortedYears = useMemo(() => 
    Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );

  return (
    <div className="relative select-text space-y-12" id="archive-timeline-wrapper">
      <div className="space-y-16">
        {sortedYears.map((year, yrIdx) => {
          const monthsInYear = grouped[year];
          const sortedMonths = Object.keys(monthsInYear).sort((a, b) => {
            return monthsInYear[b].monthIndex - monthsInYear[a].monthIndex;
          });

          return (
            <div key={year} className="space-y-10" id={`timeline-year-${year}`}>
              {/* Year Heading */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: yrIdx * 0.1 }}
                className={`relative flex items-center select-none mb-4 border-b pb-2 ml-0 ${theme.borderColor}`}
              >
                <h3 className={`text-2xl font-bold tracking-tight select-none opacity-90 ${theme.titleFont} ${theme.primaryColor}`}>
                  {year}
                </h3>
              </motion.div>

              {/* Months inside year */}
              <div className="space-y-10 pl-0">
                {sortedMonths.map((monthName) => {
                  const monthData = monthsInYear[monthName];
                  const sortedEntries = [...monthData.items].sort((a, b) => b.meta.timestamp - a.meta.timestamp);

                  return (
                    <div key={monthName} className="space-y-6" id={`timeline-month-${year}-${monthName}`}>
                      {/* Month Header Banner */}
                      <h4 className={`text-xs uppercase tracking-[0.25em] font-bold opacity-85 select-none pb-1 w-full border-b ${theme.borderColor} ${theme.metaFont}`}>
                        {monthName}
                      </h4>

                      {/* Entries inside Month */}
                      <div className="space-y-8 pl-0">
                        {sortedEntries.map(({ post }, entryIdx) => (
                          <motion.div
                            key={post.slug}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: entryIdx * 0.05 }}
                            className={`relative pr-4 pb-4 border-b ${theme.borderColor} last:border-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-6 group`}
                          >
                            <div className="flex-1 space-y-2">
                              {/* Metadata line with date, reading time, optional location & optional persona tag */}
                              <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-text flex flex-wrap items-center gap-1.5">
                                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                                <span>•</span>
                                <span className={theme.accentColor}>{post.tags?.[0] || 'Uncategorized'}</span>
                                {post.coverImageLocation && (
                                  <>
                                    <span>•</span>
                                    <span className="text-muted-text">{post.coverImageLocation}</span>
                                  </>
                                )}
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
                                <h5 className={`text-[17.5px] font-bold tracking-tight leading-snug line-clamp-2 ${theme.titleFont} ${theme.primaryColor} hover:opacity-85 duration-300`}>
                                  {post.title}
                                </h5>
                              </Link>

                              {/* Excerpt */}
                              <p className={`text-[13.5px] leading-relaxed opacity-75 font-light line-clamp-3 mt-1 ${theme.bodyFont}`}>
                                {post.excerpt || post.subtitle}
                              </p>
                            </div>

                            {/* Optional Thumbnail Image */}
                            {(!brokenImages[post.slug] && post.coverImageUrl) && (
                              <div className="hidden md:block shrink-0">
                                <Link href={`/p/${post.slug}`}>
                                  <div className={`relative w-20 h-16 sm:w-28 sm:h-20 overflow-hidden border rounded-lg bg-muted ${theme.borderColor}`}>
                                    <Image
                                      src={post.coverImageUrl || ""}
                                      alt={post.title}
                                      fill
                                      referrerPolicy="no-referrer"
                                      onError={() => setBrokenImages(prev => ({ ...prev, [post.slug]: true }))}
                                      className="object-cover w-full h-full filter saturate-85"
                                      sizes="120px"
                                      loading="lazy"
                                    />
                                  </div>
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
