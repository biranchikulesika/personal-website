"use client";

import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  PasskeyItem,
  UserSession,
  SidepanelTab,
  NewsletterSubscriber,
} from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/admin/login/actions";
import { LoadingState } from "@/components/ui/states";

import { HomeOverview } from "./home-overview";

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

const SubscriberManager = dynamic(
  () => import("./subscriber-manager").then((m) => m.SubscriberManager),
  {
    loading: () => <LoadingState title="Loading subscribers…" />,
  },
);

interface AdminDashboardProps {
  initialPosts: BlogPost[];
  initialNotes: NoteItem[];
  initialBooks: BookItem[];
  initialMedia: MediaItem[];
  initialOrphanedMedia: MediaItem[];
  initialNowEntries: NowEntry[];
  initialSubscribers?: NewsletterSubscriber[];
  initialPasskeys?: PasskeyItem[];
  initialConnectedProviders?: string[];
  initialSessions?: UserSession[];
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
  initialTab?: SidepanelTab;
}

export function AdminDashboard({
  initialPosts,
  initialNotes,
  initialBooks,
  initialMedia,
  initialOrphanedMedia,
  initialNowEntries,
  initialSubscribers = [],
  initialPasskeys = [],
  initialConnectedProviders = ["google"],
  initialSessions = [],
  initialTab = "home",
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<SidepanelTab>(initialTab);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [createBookTrigger, setCreateBookTrigger] = useState(0);
  const router = useRouter();

  // Sync state if initialTab prop changes (e.g. server-side navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle browser back/forward buttons and initial localStorage fallback
  useEffect(() => {
    const validTabs: SidepanelTab[] = [
      "home",
      "content",
      "media",
      "subscribers",
      "account",
    ];

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as SidepanelTab | null;
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };

    window.addEventListener("popstate", handlePopState);

    // If loaded on /admin without ?tab= parameter, restore saved tab from localStorage
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as SidepanelTab | null;
    if (tabParam && validTabs.includes(tabParam)) {
      try {
        localStorage.setItem("admin_active_tab", tabParam);
      } catch {}
    } else if (!tabParam) {
      try {
        const savedTab = localStorage.getItem(
          "admin_active_tab",
        ) as SidepanelTab | null;
        if (savedTab && validTabs.includes(savedTab) && savedTab !== "home") {
          setActiveTab(savedTab);
          router.replace(`/admin?tab=${savedTab}`, { scroll: false });
        }
      } catch {}
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const navigateTab = (tab: SidepanelTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem("admin_active_tab", tab);
    } catch {}
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

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
    },
    {
      id: "media" as const,
      label: "Resources",
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
    },
    {
      id: "subscribers" as const,
      label: "Subscribers",
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
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      ),
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
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-night text-paper font-sans">
      {/* ── 1. Desktop Left Fixed Sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-64 md:w-72 shrink-0 border-r border-tinted/20 bg-night-soft md:flex flex-col justify-between p-5 overflow-y-auto">
        <div className="space-y-6">
          {/* Navigation Links */}
          <nav aria-label="Admin Navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTab(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-post-card text-paper shadow-xs border border-tinted/30"
                      : "text-gray-mid hover:bg-post-card/60 hover:text-paper"
                  }`}
                >
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

      {/* ── 2. Main Scrollable Workspace Area ── */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-8 lg:p-12 pb-28 md:pb-12 bg-night">
        <div className="mx-auto max-w-6xl">
          {activeTab === "home" && (
            <HomeOverview
              posts={initialPosts}
              notes={initialNotes}
              books={initialBooks}
              media={initialMedia}
              orphanedMedia={initialOrphanedMedia}
              nowEntries={initialNowEntries}
              subscribers={initialSubscribers}
              userName={userName}
              userEmail={userEmail}
              userAvatarUrl={userAvatarUrl}
              userRole={userRole}
              onNavigateTab={(tab) => navigateTab(tab)}
              onTriggerCreateBook={() => setCreateBookTrigger((prev) => prev + 1)}
            />
          )}

          {activeTab === "content" && (
            <ContentManager
              initialPosts={initialPosts}
              initialNotes={initialNotes}
              initialBooks={initialBooks}
              initialNowEntries={initialNowEntries}
              mediaItems={initialMedia}
              openCreateBookTrigger={createBookTrigger}
            />
          )}
          {activeTab === "media" && (
            <MediaManager
              initialMedia={initialMedia}
              initialOrphanedMedia={initialOrphanedMedia}
            />
          )}
          {activeTab === "subscribers" && (
            <SubscriberManager initialSubscribers={initialSubscribers} />
          )}
          {activeTab === "account" && (
            <AccountManager
              userName={userName}
              userEmail={userEmail}
              userAvatarUrl={userAvatarUrl}
              userRole={userRole}
              initialPasskeys={initialPasskeys}
              initialConnectedProviders={initialConnectedProviders}
              initialSessions={initialSessions}
            />
          )}
        </div>
      </main>

      {/* ── Mobile Compose Semicircle Overlay & Backdrop ── */}
      {isComposeOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsComposeOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── 3. Mobile Bottom Tab Bar ── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-35 flex md:hidden items-center justify-around border-t border-tinted/20 bg-night-soft/95 px-2 py-1.5 backdrop-blur-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        {/* Semicircle Options Menu floating directly above Compose button */}
        {isComposeOpen && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-40">
            {/* Now Option */}
            <Link
              href="/admin/compose?type=now"
              onClick={() => setIsComposeOpen(false)}
              className="pointer-events-auto absolute flex flex-col items-center justify-center rounded-2xl border border-tinted/30 bg-post-card px-3 py-2 text-paper shadow-2xl transition-all duration-300 hover:bg-night-soft hover:scale-105 active:scale-95 animate-in zoom-in-75"
              style={{ transform: "translate(-86px, -36px)" }}
            >
              <span className="text-sm">⏱</span>
              <span className="text-[10px] font-semibold tracking-tight text-paper mt-0.5">Now</span>
            </Link>

            {/* Note Option */}
            <Link
              href="/admin/compose?type=note"
              onClick={() => setIsComposeOpen(false)}
              className="pointer-events-auto absolute flex flex-col items-center justify-center rounded-2xl border border-tinted/30 bg-post-card px-3 py-2 text-paper shadow-2xl transition-all duration-300 hover:bg-night-soft hover:scale-105 active:scale-95 animate-in zoom-in-75"
              style={{ transform: "translate(-32px, -82px)" }}
            >
              <span className="text-sm">📝</span>
              <span className="text-[10px] font-semibold tracking-tight text-paper mt-0.5">Note</span>
            </Link>

            {/* Post Option */}
            <Link
              href="/admin/compose?type=post"
              onClick={() => setIsComposeOpen(false)}
              className="pointer-events-auto absolute flex flex-col items-center justify-center rounded-2xl border border-tinted/30 bg-post-card px-3 py-2 text-paper shadow-2xl transition-all duration-300 hover:bg-night-soft hover:scale-105 active:scale-95 animate-in zoom-in-75"
              style={{ transform: "translate(32px, -82px)" }}
            >
              <span className="text-sm">📄</span>
              <span className="text-[10px] font-semibold tracking-tight text-paper mt-0.5">Post</span>
            </Link>

            {/* Book Option */}
            <button
              type="button"
              onClick={() => {
                navigateTab("content");
                setCreateBookTrigger((prev) => prev + 1);
                setIsComposeOpen(false);
              }}
              className="pointer-events-auto absolute flex flex-col items-center justify-center rounded-2xl border border-tinted/30 bg-post-card px-3 py-2 text-paper shadow-2xl transition-all duration-300 hover:bg-night-soft hover:scale-105 active:scale-95 animate-in zoom-in-75"
              style={{ transform: "translate(86px, -36px)" }}
            >
              <span className="text-sm">📚</span>
              <span className="text-[10px] font-semibold tracking-tight text-paper mt-0.5">Book</span>
            </button>
          </div>
        )}

        {/* Home Tab */}
        <button
          type="button"
          aria-label="Home"
          onClick={() => {
            navigateTab("home");
            setIsComposeOpen(false);
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
            activeTab === "home"
              ? "bg-post-card text-accent border border-tinted/30 shadow-xs"
              : "text-gray-mid hover:bg-post-card/50 hover:text-paper"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Content Tab */}
        <button
          type="button"
          aria-label="Content"
          onClick={() => {
            navigateTab("content");
            setIsComposeOpen(false);
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
            activeTab === "content"
              ? "bg-post-card text-accent border border-tinted/30 shadow-xs"
              : "text-gray-mid hover:bg-post-card/50 hover:text-paper"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </button>

        {/* Center Compose Action Button */}
        <button
          type="button"
          onClick={() => setIsComposeOpen((prev) => !prev)}
          className="flex items-center justify-center focus:outline-none"
          aria-label={isComposeOpen ? "Close compose options" : "Open compose options"}
          aria-expanded={isComposeOpen}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all duration-200 border-2 border-night active:scale-90 ${
              isComposeOpen
                ? "bg-night-soft text-paper border-tinted/40 rotate-45"
                : "bg-accent text-paper hover:bg-accent-hover"
            }`}
          >
            <span className="text-2xl leading-none font-light">+</span>
          </div>
        </button>

        {/* Resources Tab */}
        <button
          type="button"
          aria-label="Resources"
          onClick={() => {
            navigateTab("media");
            setIsComposeOpen(false);
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
            activeTab === "media"
              ? "bg-post-card text-accent border border-tinted/30 shadow-xs"
              : "text-gray-mid hover:bg-post-card/50 hover:text-paper"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>

        {/* Account Tab */}
        <button
          type="button"
          aria-label="Account"
          onClick={() => {
            navigateTab("account");
            setIsComposeOpen(false);
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
            activeTab === "account"
              ? "bg-post-card text-accent border border-tinted/30 shadow-xs"
              : "text-gray-mid hover:bg-post-card/50 hover:text-paper"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
