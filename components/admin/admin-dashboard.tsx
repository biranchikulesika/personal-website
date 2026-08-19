'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AdminProfile, BlogPost, BookItem, MediaItem, NoteItem } from '@/lib/types';
import { ContentManager } from './content-manager';
import { LibraryManager } from './library-manager';
import { MediaManager } from './media-manager';
import { AccountManager } from './account-manager';

interface AdminDashboardProps {
  initialPosts: BlogPost[];
  initialNotes: NoteItem[];
  initialBooks: BookItem[];
  initialMedia: MediaItem[];
  initialProfile: AdminProfile;
}

type SidepanelTab = 'home' | 'content' | 'library' | 'media' | 'account';

export function AdminDashboard({
  initialPosts,
  initialNotes,
  initialBooks,
  initialMedia,
  initialProfile,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<SidepanelTab>('home');

  const totalContentCount = initialPosts.length + initialNotes.length;

  const navItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      count: undefined,
    },
    {
      id: 'content' as const,
      label: 'Posts & Notes',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      count: totalContentCount,
    },
    {
      id: 'library' as const,
      label: 'Library',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      count: initialBooks.length,
    },
    {
      id: 'media' as const,
      label: 'Media Resources',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      count: initialMedia.length,
    },
    {
      id: 'account' as const,
      label: 'Account',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      count: undefined,
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-paper">
      {/* 1. Left Fixed / Sticky Sidebar */}
      <aside className="sticky top-0 h-screen w-64 md:w-72 shrink-0 border-r border-tinted bg-cream flex flex-col justify-between p-5 overflow-y-auto">
        <div className="space-y-6">
          {/* Workspace Branding / User Header */}
          <div className="flex items-center gap-3 border-b border-tinted pb-4">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-tinted bg-paper shadow-xs">
              <Image
                src={initialProfile.avatarUrl || '/biranchi.jpeg'}
                alt={initialProfile.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-base font-medium text-ink">
                {initialProfile.name}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                <span className="truncate">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Admin Navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-ink text-cream shadow-xs'
                      : 'text-ink-soft hover:bg-paper hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-cream' : 'text-ink-soft group-hover:text-ink'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isActive
                          ? 'bg-cream/20 text-cream'
                          : 'bg-paper text-ink-soft ring-1 ring-tinted'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Footer */}
        <div className="border-t border-tinted pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-paper py-2.5 text-xs font-semibold text-ink ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
          >
            <span>View Public Site</span>
            <span>↗</span>
          </Link>
        </div>
      </aside>

      {/* 2. Main Scrollable Workspace Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-10 lg:p-12">
        <div className="mx-auto max-w-6xl">
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-tinted pb-6">
                <div>
                  <h2 className="font-serif text-3xl font-normal text-ink md:text-4xl">
                    Welcome back, {initialProfile.name.split(' ')[0]}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    This is your quiet administrative dashboard for publishing essays, notes, bookshelf readings, and managing assets.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('content')}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-accent"
                  >
                    Manage Posts & Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="rounded-full bg-paper px-4 py-2 text-xs font-semibold text-ink ring-1 ring-tinted hover:bg-cream"
                  >
                    + Add Book
                  </button>
                </div>
              </div>

              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className="flex flex-col items-start rounded-3xl border border-tinted bg-cream p-5 text-left shadow-sm transition-all hover:border-ink/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Essays
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-ink">
                    {initialPosts.length}
                  </span>
                  <span className="mt-2 text-xs text-ink-soft underline decoration-tinted underline-offset-4">
                    Manage Essays →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className="flex flex-col items-start rounded-3xl border border-tinted bg-cream p-5 text-left shadow-sm transition-all hover:border-ink/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Notes
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-ink">
                    {initialNotes.length}
                  </span>
                  <span className="mt-2 text-xs text-ink-soft underline decoration-tinted underline-offset-4">
                    Manage Notes →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="flex flex-col items-start rounded-3xl border border-tinted bg-cream p-5 text-left shadow-sm transition-all hover:border-ink/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Library Books
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-ink">
                    {initialBooks.length}
                  </span>
                  <span className="mt-2 text-xs text-ink-soft underline decoration-tinted underline-offset-4">
                    Manage Shelf →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className="flex flex-col items-start rounded-3xl border border-tinted bg-cream p-5 text-left shadow-sm transition-all hover:border-ink/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Media Assets
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-ink">
                    {initialMedia.length}
                  </span>
                  <span className="mt-2 text-xs text-ink-soft underline decoration-tinted underline-offset-4">
                    Browse Assets →
                  </span>
                </button>
              </div>

              {/* Recent Content Lists */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Latest Essays */}
                <div className="rounded-3xl border border-tinted bg-cream p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-tinted pb-3">
                    <h3 className="font-serif text-base font-normal text-ink">
                      Recent Essays
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('content')}
                      className="text-xs font-semibold text-ink-soft hover:text-ink"
                    >
                      View all ({initialPosts.length})
                    </button>
                  </div>

                  <ul className="mt-3 divide-y divide-tinted/60">
                    {initialPosts.slice(0, 3).map((post) => (
                      <li key={post.slug} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-medium text-ink">
                              {post.title}
                            </h4>
                            <p className="text-[10px] text-ink-soft">
                              {post.plantedAt}
                            </p>
                          </div>
                          <Link
                            href={`/writing/${post.slug}`}
                            target="_blank"
                            className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink ring-1 ring-tinted hover:bg-ink hover:text-cream"
                          >
                            ↗
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Latest Notes */}
                <div className="rounded-3xl border border-tinted bg-cream p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-tinted pb-3">
                    <h3 className="font-serif text-base font-normal text-ink">
                      Recent Notes
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('content')}
                      className="text-xs font-semibold text-ink-soft hover:text-ink"
                    >
                      View all ({initialNotes.length})
                    </button>
                  </div>

                  <ul className="mt-3 divide-y divide-tinted/60">
                    {initialNotes.slice(0, 3).map((note) => (
                      <li key={note.slug} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-medium text-ink">
                              {note.title}
                            </h4>
                            <p className="text-[10px] text-ink-soft">
                              {note.date}
                            </p>
                          </div>
                          <Link
                            href={`/notes/${note.slug}`}
                            target="_blank"
                            className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink ring-1 ring-tinted hover:bg-ink hover:text-cream"
                          >
                            ↗
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Latest Books */}
                <div className="rounded-3xl border border-tinted bg-cream p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-tinted pb-3">
                    <h3 className="font-serif text-base font-normal text-ink">
                      Library Shelf
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('library')}
                      className="text-xs font-semibold text-ink-soft hover:text-ink"
                    >
                      View all ({initialBooks.length})
                    </button>
                  </div>

                  <ul className="mt-3 divide-y divide-tinted/60">
                    {initialBooks.slice(0, 3).map((book) => (
                      <li key={book.slug} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-medium text-ink">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-ink-soft truncate">
                              by {book.author}
                            </p>
                          </div>
                          <Link
                            href="/library"
                            target="_blank"
                            className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink ring-1 ring-tinted hover:bg-ink hover:text-cream"
                          >
                            ↗
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <ContentManager initialPosts={initialPosts} initialNotes={initialNotes} />
          )}
          {activeTab === 'library' && <LibraryManager initialBooks={initialBooks} />}
          {activeTab === 'media' && <MediaManager initialMedia={initialMedia} />}
          {activeTab === 'account' && (
            <AccountManager initialProfile={initialProfile} />
          )}
        </div>
      </main>
    </div>
  );
}
