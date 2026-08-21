"use client";

import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
} from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { logoutAction } from "@/app/admin/login/actions";
import { LoadingState } from "@/components/ui/states";

// Lazy-load tab-specific managers. They are only needed when their tab is
// active, so splitting them into separate chunks reduces the initial admin
// dashboard bundle.
const ContentManager = dynamic(
  () => import("./content-manager").then((m) => m.ContentManager),
  {
    loading: () => <LoadingState title="Loading content…" />,
  },
);
const MediaManager = dynamic(
  () => import("./media-manager").then((m) => m.MediaManager),
  {
    loading: () => <LoadingState title="Loading media…" />,
  },
);
const AccountManager = dynamic(
  () => import("./account-manager").then((m) => m.AccountManager),
  {
    loading: () => <LoadingState title="Loading account…" />,
  },
);
const FeaturedManager = dynamic(
  () => import("./featured-manager").then((m) => m.FeaturedManager),
  {
    loading: () => <LoadingState title="Loading featured…" />,
  },
);

interface AdminDashboardProps {
  initialPosts: BlogPost[];
  initialNotes: NoteItem[];
  initialBooks: BookItem[];
  initialMedia: MediaItem[];
  initialOrphanedMedia: MediaItem[];
  initialNowEntries: NowEntry[];
  initialFeaturedPostSlugs: string[];
  initialFeaturedBookSlugs: string[];
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
}

type SidepanelTab = "home" | "featured" | "content" | "media" | "account";

export function AdminDashboard({
  initialPosts,
  initialNotes,
  initialBooks,
  initialMedia,
  initialOrphanedMedia,
  initialNowEntries,
  initialFeaturedPostSlugs,
  initialFeaturedBookSlugs,
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<SidepanelTab>("home");

  const totalContentCount =
    initialPosts.length + initialNotes.length + initialNowEntries.length;

  const navItems = [
    {
      id: "home" as const,
      label: "Home",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      count: undefined,
    },
    {
      id: "featured" as const,
      label: "Featured",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ),
      count: undefined,
    },
    {
      id: "content" as const,
      label: "Content",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      ),
      count: totalContentCount,
    },
    {
      id: "media" as const,
      label: "Media Resources",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      ),
      count: initialMedia.length,
    },
    {
      id: "account" as const,
      label: "Account",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      ),
      count: undefined,
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-night text-paper font-sans">
      {/* 1. Left Fixed / Sticky Sidebar */}
      <aside className="sticky top-0 h-screen w-64 md:w-72 shrink-0 border-r border-tinted/20 bg-night-soft flex flex-col justify-between p-5 overflow-y-auto">
        <div className="space-y-6">
          {/* Workspace Branding / User Header */}
          <div className="flex items-center gap-3 border-b border-tinted/20 pb-4">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-tinted/20 bg-post-card shadow-xs">
              <Image
                src={userAvatarUrl || "/biranchi.jpeg"}
                alt={userName}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-base font-medium text-paper">
                {userName}
              </div>
              <div className="truncate text-[10px] text-gray-mid capitalize">
                {userRole.replace('_', ' ')}
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
                      ? "bg-post-card text-paper shadow-xs border border-tinted/30"
                      : "text-gray-mid hover:bg-post-card/60 hover:text-paper"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        isActive
                          ? "text-accent"
                          : "text-gray-mid group-hover:text-paper"
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === "number" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isActive
                          ? "bg-accent/20 text-accent"
                          : "bg-night text-gray-mid ring-1 ring-tinted/20"
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
        <div className="space-y-3 border-t border-tinted/20 pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-night-soft border border-tinted/20 py-2.5 text-xs font-semibold text-paper transition-colors hover:bg-post-card hover:border-accent/40"
          >
            <span>View Public Site</span>
            <span>↗</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logoutAction();
              window.location.href = "/admin/login";
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-tinted/20 bg-night-soft py-2.5 text-xs font-semibold text-gray-mid transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* 2. Main Scrollable Workspace Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-10 lg:p-12 bg-night">
        <div className="mx-auto max-w-6xl">
          {activeTab === "home" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-tinted/20 pb-6">
                <div>
                  <h2 className="font-serif text-3xl font-normal text-paper md:text-4xl">
                    Welcome back, {userName.split(" ")[0]}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("content")}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors"
                  >
                    Manage Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("content")}
                    className="rounded-full bg-post-card border border-tinted/20 px-4 py-2 text-xs font-semibold text-paper hover:bg-night-soft"
                  >
                    + Add Book
                  </button>
                </div>
              </div>

              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className="flex flex-col items-start rounded-3xl border border-tinted/20 bg-post-card p-5 text-left shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Essays
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-paper">
                    {initialPosts.length}
                  </span>
                  <span className="mt-2 text-xs text-teal underline decoration-teal/40 underline-offset-4 hover:text-accent">
                    Manage Essays →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className="flex flex-col items-start rounded-3xl border border-tinted/20 bg-post-card p-5 text-left shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Notes
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-paper">
                    {initialNotes.length}
                  </span>
                  <span className="mt-2 text-xs text-teal underline decoration-teal/40 underline-offset-4 hover:text-accent">
                    Manage Notes →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className="flex flex-col items-start rounded-3xl border border-tinted/20 bg-post-card p-5 text-left shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Library Books
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-paper">
                    {initialBooks.length}
                  </span>
                  <span className="mt-2 text-xs text-teal underline decoration-teal/40 underline-offset-4 hover:text-accent">
                    Manage Shelf →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("media")}
                  className="flex flex-col items-start rounded-3xl border border-tinted/20 bg-post-card p-5 text-left shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Media Assets
                  </span>
                  <span className="mt-2 font-serif text-3xl font-normal text-paper">
                    {initialMedia.length}
                  </span>
                  <span className="mt-2 text-xs text-teal underline decoration-teal/40 underline-offset-4 hover:text-accent">
                    Browse Assets →
                  </span>
                </button>
              </div>

              {/* Recent Content Lists */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Latest Essays */}
                <div className="rounded-3xl border border-tinted/20 bg-post-card p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-tinted/20 pb-3">
                    <h3 className="font-serif text-base font-normal text-paper">
                      Recent Essays
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("content")}
                      className="text-xs font-semibold text-gray-mid hover:text-accent"
                    >
                      View all ({initialPosts.length})
                    </button>
                  </div>

                  <ul className="mt-3 divide-y divide-tinted/20">
                    {initialPosts.slice(0, 3).map((post) => (
                      <li
                        key={post.slug}
                        className="py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-medium text-paper">
                              {post.title}
                            </h4>
                            <p className="text-[10px] text-gray-mid">
                              {post.publishedAt}
                            </p>
                          </div>
                          <Link
                            href={`/p/${post.slug}`}
                            target="_blank"
                            className="shrink-0 rounded-full bg-night-soft border border-tinted/20 px-2 py-0.5 text-[10px] font-semibold text-paper hover:bg-accent hover:border-accent"
                          >
                            ↗
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Latest Notes */}
                <div className="rounded-3xl border border-tinted/20 bg-post-card p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-tinted/20 pb-3">
                    <h3 className="font-serif text-base font-normal text-paper">
                      Recent Notes
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("content")}
                      className="text-xs font-semibold text-gray-mid hover:text-accent"
                    >
                      View all ({initialNotes.length})
                    </button>
                  </div>

                  <ul className="mt-3 divide-y divide-tinted/20">
                    {initialNotes.slice(0, 3).map((note) => (
                      <li
                        key={note.slug}
                        className="py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-medium text-paper">
                              {note.title}
                            </h4>
                            <p className="text-[10px] text-gray-mid">
                              {formatDisplayDate(note.date)}
                            </p>
                          </div>
                          <Link
                            href={`/n/${note.slug}`}
                            target="_blank"
                            className="shrink-0 rounded-full bg-night-soft border border-tinted/20 px-2 py-0.5 text-[10px] font-semibold text-paper hover:bg-accent hover:border-accent"
                          >
                            ↗
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Latest Books */}
                <div className="rounded-3xl border border-tinted/20 bg-post-card p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-tinted/20 pb-3">
                    <h3 className="font-serif text-base font-normal text-paper">
                      Library Shelf
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("content")}
                      className="text-xs font-semibold text-gray-mid hover:text-accent"
                    >
                      View all ({initialBooks.length})
                    </button>
                  </div>

                  <ul className="mt-3 divide-y divide-tinted/20">
                    {initialBooks.slice(0, 3).map((book) => (
                      <li
                        key={book.slug}
                        className="py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-medium text-paper">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-gray-mid truncate">
                              by {book.author}
                            </p>
                          </div>
                          <Link
                            href="/library"
                            target="_blank"
                            className="shrink-0 rounded-full bg-night-soft border border-tinted/20 px-2 py-0.5 text-[10px] font-semibold text-paper hover:bg-accent hover:border-accent"
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

          {activeTab === "featured" && (
            <FeaturedManager
              posts={initialPosts}
              books={initialBooks}
              initialFeaturedPostSlugs={initialFeaturedPostSlugs}
              initialFeaturedBookSlugs={initialFeaturedBookSlugs}
            />
          )}
          {activeTab === "content" && (
            <ContentManager
              initialPosts={initialPosts}
              initialNotes={initialNotes}
              initialBooks={initialBooks}
              initialNowEntries={initialNowEntries}
              mediaItems={initialMedia}
            />
          )}
          {activeTab === "media" && (
            <MediaManager
              initialMedia={initialMedia}
              initialOrphanedMedia={initialOrphanedMedia}
            />
          )}
          {activeTab === "account" && (
            <AccountManager
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
            />
          )}
        </div>
      </main>
    </div>
  );
}
