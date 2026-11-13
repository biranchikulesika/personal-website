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
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/states";
import {
  CloseIcon,
  ExternalLinkIcon,
  HomeIcon,
  LibraryIcon,
  ComposeIcon,
  ImageIcon,
  UsersIcon,
  SettingsIcon,
  SearchIcon,
  PlusIcon,
} from "@/components/icons";

import { AccountMenu } from "./account-menu";
import { HomeOverview } from "./home-overview";
import { NewContentDialog } from "./new-content-dialog";
import { SearchPalette } from "./search-palette";
import { Button } from "./ui";

// Lazy-load tab-specific managers. They are only needed when their tab is
// active, so splitting them into separate chunks reduces the initial admin
// dashboard bundle.
const ContentManager = dynamic(
  () => import("./content-manager").then((m) => m.ContentManager),
  {
    loading: () => <LoadingState title="Loading library…" />,
  },
);
const MediaManager = dynamic(
  () => import("./media-manager").then((m) => m.MediaManager),
  {
    loading: () => <LoadingState title="Loading media…" />,
  },
);
const SettingsManager = dynamic(
  () => import("./settings-manager").then((m) => m.SettingsManager),
  {
    loading: () => <LoadingState title="Loading settings…" />,
  },
);
const SubscriberManager = dynamic(
  () => import("./subscriber-manager").then((m) => m.SubscriberManager),
  {
    loading: () => <LoadingState title="Loading audience…" />,
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

const validTabs: SidepanelTab[] = [
  "home",
  "content",
  "media",
  "subscribers",
  "settings",
];

const navItems = [
  { id: "home" as const, label: "Overview", icon: HomeIcon },
  { id: "content" as const, label: "Library", icon: LibraryIcon },
  { id: "write" as const, label: "Write", icon: ComposeIcon },
  { id: "media" as const, label: "Media", icon: ImageIcon },
  { id: "subscribers" as const, label: "Audience", icon: UsersIcon },
  { id: "settings" as const, label: "Settings", icon: SettingsIcon },
];

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [createBookTrigger, setCreateBookTrigger] = useState(0);
  const router = useRouter();

  // Sync state if initialTab prop changes (e.g. server-side navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Cmd/Ctrl+K opens global search from any admin screen.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Handle browser back/forward buttons and initial localStorage fallback.
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as SidepanelTab | null;
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };

    window.addEventListener("popstate", handlePopState);

    // If loaded on /admin without ?tab=, restore the last visited tab.
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

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileNavOpen]);

  const navigateTab = useCallback(
    (tab: SidepanelTab) => {
      setActiveTab(tab);
      setIsMobileNavOpen(false);
      try {
        localStorage.setItem("admin_active_tab", tab);
      } catch {}
      router.replace(`/admin?tab=${tab}`, { scroll: false });
    },
    [router],
  );

  const openSettings = useCallback(
    () => navigateTab("settings"),
    [navigateTab],
  );

  const openContent = useCallback(
    (kind: "post" | "note" | "now" | "book", slug: string) => {
      setIsSearchOpen(false);
      if (kind === "book") {
        navigateTab("content");
        return;
      }
      router.push(
        `/admin/compose?type=${kind}&slug=${encodeURIComponent(slug)}`,
      );
    },
    [navigateTab, router],
  );

  const openMedia = useCallback(
    (query: string) => {
      setIsSearchOpen(false);
      setMediaSearch(query);
      navigateTab("media");
    },
    [navigateTab],
  );

  const handleCreate = useCallback(
    (kind: "post" | "note" | "now" | "book") => {
      setIsNewOpen(false);
      if (kind === "book") {
        navigateTab("content");
        setCreateBookTrigger((trigger) => trigger + 1);
        return;
      }
      router.push(`/admin/compose?type=${kind}`);
    },
    [navigateTab, router],
  );

  const sidebar = (
    <>
      <nav aria-label="Admin" className="flex-1 space-y-1 px-2 pt-5">
        {navItems.map((item) => {
          const isAction = item.id === "write";
          const isActive = !isAction && activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (isAction) {
                  router.push("/admin/compose?type=post");
                  return;
                }
                navigateTab(item.id);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? "border-tinted/30 bg-post-card text-paper"
                  : "border-transparent text-gray-mid hover:bg-post-card/50 hover:text-paper"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-accent" : "text-gray-mid"
                }`}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-tinted/20 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
        >
          <span>View public site</span>
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-night font-sans text-paper">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-tinted/20 bg-night-soft/30 md:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-tinted/20 bg-night-soft shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 rounded-full p-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-tinted/20 bg-night/90 px-3 backdrop-blur-md sm:px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={isMobileNavOpen}
            className="rounded-lg p-2 text-gray-mid transition-colors hover:bg-post-card hover:text-paper md:hidden"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <p className="text-sm font-medium text-paper md:hidden">
            {navItems.find((item) => item.id === activeTab)?.label ?? "Workspace"}
          </p>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-tinted/30 bg-night-soft px-2.5 text-xs text-gray-mid transition-colors hover:border-tinted/50 hover:text-paper sm:min-w-[220px]"
              aria-label="Search (Command K)"
            >
              <SearchIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-auto hidden rounded border border-tinted/40 px-1 py-0.5 text-[10px] sm:inline">
                ⌘K
              </kbd>
            </button>

            <Button variant="primary" onClick={() => setIsNewOpen(true)}>
              <PlusIcon className="h-3.5 w-3.5" />
              New
            </Button>

            <Link
              href="/"
              target="_blank"
              aria-label="View public site"
              title="View public site"
              className="hidden h-9 items-center justify-center rounded-lg border border-tinted/30 bg-night-soft px-2.5 text-gray-mid transition-colors hover:border-tinted/50 hover:text-paper sm:flex"
            >
              <ExternalLinkIcon className="h-4 w-4" />
            </Link>

            <AccountMenu
              compact
              userName={userName}
              userEmail={userEmail}
              userAvatarUrl={userAvatarUrl}
              userRole={userRole}
              onOpenSettings={openSettings}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
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
              onTriggerCreateBook={() => {
                navigateTab("content");
                setCreateBookTrigger((trigger) => trigger + 1);
              }}
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
              allContent={{
                posts: initialPosts,
                notes: initialNotes,
                books: initialBooks,
              }}
              initialSearchQuery={mediaSearch}
            />
          )}

          {activeTab === "subscribers" && (
            <SubscriberManager initialSubscribers={initialSubscribers} />
          )}

          {activeTab === "settings" && (
            <SettingsManager
              userName={userName}
              userEmail={userEmail}
              userAvatarUrl={userAvatarUrl}
              userRole={userRole}
              initialPasskeys={initialPasskeys}
              initialConnectedProviders={initialConnectedProviders}
              initialSessions={initialSessions}
              exportData={{
                posts: initialPosts,
                notes: initialNotes,
                books: initialBooks,
                nowEntries: initialNowEntries,
                media: initialMedia,
                subscribers: initialSubscribers,
              }}
            />
          )}
        </main>
      </div>

      <SearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        posts={initialPosts}
        notes={initialNotes}
        books={initialBooks}
        nowEntries={initialNowEntries}
        media={initialMedia}
        onOpenContent={openContent}
        onOpenMedia={openMedia}
      />

      <NewContentDialog
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSelect={handleCreate}
      />
    </div>
  );
}
