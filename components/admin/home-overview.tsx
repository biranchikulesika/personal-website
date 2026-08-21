"use client";

import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  SidepanelTab,
} from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import Link from "next/link";

interface HomeOverviewProps {
  posts: BlogPost[];
  notes: NoteItem[];
  books: BookItem[];
  media: MediaItem[];
  orphanedMedia: MediaItem[];
  nowEntries: NowEntry[];
  featuredPostSlugs: string[];
  featuredBookSlugs: string[];
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
  onNavigateTab: (tab: SidepanelTab) => void;
  onTriggerCreateBook: () => void;
}

export function HomeOverview({
  posts,
  notes,
  books,
  nowEntries,
  userName,
  onNavigateTab,
  onTriggerCreateBook,
}: HomeOverviewProps) {
  const publishedPosts = posts.filter((p) => p.status !== "unpublished");
  const draftPosts = posts.filter((p) => p.status === "unpublished");

  const publishedNotes = notes.filter((n) => n.status !== "unpublished");
  const draftNotes = notes.filter((n) => n.status === "unpublished");

  const allDrafts = [
    ...draftPosts.map((p) => ({
      id: `post-${p.slug}`,
      type: "post" as const,
      title: p.title,
      date: p.lastEditedAt || p.publishedAt || "",
      slug: p.slug,
    })),
    ...draftNotes.map((n) => ({
      id: `note-${n.slug}`,
      type: "note" as const,
      title: n.title,
      date: n.date || "",
      slug: n.slug,
    })),
  ];

  type ActivityItem = {
    id: string;
    type: "post" | "note" | "book" | "now";
    title: string;
    subtitle?: string;
    date: string;
    slug?: string;
    status?: "published" | "unpublished";
    extra?: string;
  };

  const recentItems: ActivityItem[] = [
    ...posts.map((p) => ({
      id: `post-${p.slug}`,
      type: "post" as const,
      title: p.title,
      subtitle: p.subtitle || p.description,
      date: p.lastEditedAt || p.publishedAt || "",
      slug: p.slug,
      status: p.status || "published",
      extra: p.persona || "builder",
    })),
    ...notes.map((n) => ({
      id: `note-${n.slug}`,
      type: "note" as const,
      title: n.title,
      subtitle: n.subtitle || (n.content?.[0] ? n.content[0].slice(0, 100) : n.description),
      date: n.date || "",
      slug: n.slug,
      status: n.status || "published",
      extra: n.persona,
    })),
    ...nowEntries.map((e) => ({
      id: `now-${e.id}`,
      type: "now" as const,
      title: e.title || "Now Timeline",
      subtitle: e.content.slice(0, 90),
      date: e.date || "",
      status: "published" as const,
      extra: "timeline",
    })),
    ...books.map((b) => ({
      id: `book-${b.slug}`,
      type: "book" as const,
      title: b.title,
      subtitle: `by ${b.author}`,
      date: b.date || "",
      slug: b.slug,
      status: "published" as const,
      extra: "library",
    })),
  ]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 10);

  const latestNow = nowEntries.length > 0 ? nowEntries[0] : null;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-tinted/15 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-normal text-paper md:text-4xl">
            {userName}
          </h1>
          <p className="mt-2 text-xs text-gray-mid tracking-wide">
            {publishedPosts.length} published essays · {publishedNotes.length} notes · {books.length} books
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/compose?type=post"
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-paper hover:bg-accent-hover transition-colors shadow-xs"
          >
            + Post
          </Link>
          <Link
            href="/admin/compose?type=note"
            className="rounded-full border border-tinted/20 bg-night-soft px-4 py-1.5 text-xs font-medium text-paper hover:bg-tinted/10 transition-colors"
          >
            + Note
          </Link>
          <Link
            href="/admin/compose?type=now"
            className="rounded-full border border-tinted/20 bg-night-soft px-4 py-1.5 text-xs font-medium text-paper hover:bg-tinted/10 transition-colors"
          >
            + Now
          </Link>
          <button
            type="button"
            onClick={() => {
              onNavigateTab("content");
              onTriggerCreateBook();
            }}
            className="rounded-full border border-tinted/20 bg-night-soft px-4 py-1.5 text-xs font-medium text-paper hover:bg-tinted/10 transition-colors"
          >
            + Book
          </button>
        </div>
      </div>

      {/* In-Progress Drafts (if any) */}
      {allDrafts.length > 0 && (
        <section aria-labelledby="drafts-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-tinted/10 pb-2">
            <h2 id="drafts-heading" className="text-xs font-semibold uppercase tracking-wider text-accent">
              Drafts in Progress ({allDrafts.length})
            </h2>
          </div>

          <div className="divide-y divide-tinted/10">
            {allDrafts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 group"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs capitalize text-accent font-medium">
                      {item.type}
                    </span>
                    <span className="text-xs text-paper font-normal truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-mid mt-0.5">
                    {item.date ? formatDisplayDate(item.date) : "Draft"}
                  </p>
                </div>

                <Link
                  href={`/admin/compose?type=${item.type}&slug=${encodeURIComponent(item.slug)}`}
                  className="shrink-0 text-xs text-accent hover:underline font-medium"
                >
                  Resume →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Current /now status snippet */}
      {latestNow && (
        <section aria-labelledby="now-heading" className="space-y-2">
          <div className="flex items-center justify-between border-b border-tinted/10 pb-2">
            <div className="flex items-center gap-2">
              <h2 id="now-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
                Current Status (/now)
              </h2>
              <span className="text-[11px] text-gray-mid">· {formatDisplayDate(latestNow.date)}</span>
            </div>
            <Link
              href="/admin/compose?type=now"
              className="text-xs text-gray-mid hover:text-paper"
            >
              Update →
            </Link>
          </div>
          <p className="text-sm text-paper/80 leading-relaxed font-serif italic pt-1">
            "{latestNow.content}"
          </p>
        </section>
      )}

      {/* Recent Writing & Activity */}
      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex items-center justify-between border-b border-tinted/10 pb-2">
          <h2 id="recent-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
            Recent Publications & Edits
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab("content")}
            className="text-xs text-gray-mid hover:text-paper transition-colors"
          >
            All Content →
          </button>
        </div>

        <div className="divide-y divide-tinted/10">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3.5 group"
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono text-gray-mid uppercase">
                    {item.type}
                  </span>
                  <Link
                    href={
                      item.slug
                        ? `/admin/compose?type=${item.type}&slug=${encodeURIComponent(item.slug)}`
                        : `/admin/compose?type=${item.type}`
                    }
                    className="truncate text-sm font-normal text-paper hover:text-accent transition-colors"
                  >
                    {item.title}
                  </Link>
                  {item.status === "unpublished" && (
                    <span className="text-[10px] text-accent font-medium">
                      (Draft)
                    </span>
                  )}
                </div>

                {item.subtitle && (
                  <p className="text-xs text-gray-mid truncate mt-1">
                    {item.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-mid">
                <span>{formatDisplayDate(item.date)}</span>
                {item.slug && item.status !== "unpublished" && (
                  <Link
                    href={
                      item.type === "post"
                        ? `/p/${item.slug}`
                        : item.type === "note"
                          ? `/n/${item.slug}`
                          : "/library"
                    }
                    target="_blank"
                    className="hover:text-paper transition-colors"
                    title="View on site"
                  >
                    ↗
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
