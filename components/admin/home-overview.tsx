"use client";

import type {
  BlogPost,
  BookItem,
  MediaItem,
  NoteItem,
  NowEntry,
  SidepanelTab,
  NewsletterSubscriber,
} from "@/lib/types";
import { formatDisplayDate, stripMarkdown } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRightIcon,
  ComposeIcon,
  ExternalLinkIcon,
} from "@/components/icons";
import {
  Button,
  buttonClassName,
  CountStat,
  PageHeader,
  SectionHeading,
  StatusBadge,
  TypeBadge,
} from "./ui";

interface HomeOverviewProps {
  posts: BlogPost[];
  notes: NoteItem[];
  books: BookItem[];
  media: MediaItem[];
  orphanedMedia: MediaItem[];
  nowEntries: NowEntry[];
  subscribers?: NewsletterSubscriber[];
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
  onNavigateTab: (tab: SidepanelTab) => void;
  onTriggerCreateBook: () => void;
}

type ActivityItem = {
  id: string;
  kind: "post" | "note" | "now" | "book";
  title: string;
  subtitle?: string;
  date: string;
  ok: boolean;
  href: string;
  publicHref?: string;
};

export function HomeOverview({
  posts,
  notes,
  books,
  nowEntries,
  subscribers = [],
  userName,
  onNavigateTab,
}: HomeOverviewProps) {
  const publishedPosts = posts.filter((post) => post.status !== "unpublished");
  const publishedNotes = notes.filter((note) => note.status !== "unpublished");
  const publishedBooks = books.filter(
    (book) => book.isPublished !== false && book.status !== "unpublished",
  );
  const activeSubscribers = subscribers.filter(
    (subscriber) => subscriber.status === "active",
  );

  const latestNow =
    nowEntries.find((entry) => entry.status !== "unpublished") ??
    nowEntries[0] ??
    null;

  const drafts = [
    ...posts
      .filter((post) => post.status === "unpublished")
      .map((post) => ({
        id: `post-${post.slug}`,
        kind: "post" as const,
        title: post.title,
        date: post.lastEditedAt || post.publishedAt || "",
        href: `/admin/compose?type=post&slug=${encodeURIComponent(post.slug)}`,
      })),
    ...notes
      .filter((note) => note.status === "unpublished")
      .map((note) => ({
        id: `note-${note.slug}`,
        kind: "note" as const,
        title: note.title,
        date: note.date || "",
        href: `/admin/compose?type=note&slug=${encodeURIComponent(note.slug)}`,
      })),
  ]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 2);

  const activity: ActivityItem[] = [
    ...posts.map((post) => ({
      id: `post-${post.slug}`,
      kind: "post" as const,
      title: post.title,
      subtitle: post.subtitle || post.description,
      date: post.lastEditedAt || post.publishedAt || "",
      ok: post.status !== "unpublished",
      href: `/admin/compose?type=post&slug=${encodeURIComponent(post.slug)}`,
      publicHref:
        post.status !== "unpublished" ? `/p/${post.slug}` : undefined,
    })),
    ...notes.map((note) => ({
      id: `note-${note.slug}`,
      kind: "note" as const,
      title: note.title,
      subtitle: note.subtitle || note.description,
      date: note.date || "",
      ok: note.status !== "unpublished",
      href: `/admin/compose?type=note&slug=${encodeURIComponent(note.slug)}`,
      publicHref:
        note.status !== "unpublished" ? `/n/${note.slug}` : undefined,
    })),
    ...books.map((book) => ({
      id: `book-${book.slug}`,
      kind: "book" as const,
      title: book.title,
      subtitle: `by ${book.author}`,
      date: book.date || "",
      ok: book.isPublished !== false && book.status !== "unpublished",
      href: "/admin?tab=content",
      publicHref: "/library",
    })),
    ...nowEntries.map((entry) => ({
      id: `now-${entry.id}`,
      kind: "now" as const,
      title: entry.title || "Now entry",
      subtitle: stripMarkdown(entry.content || "").slice(0, 90),
      date: entry.date || "",
      ok: entry.status !== "unpublished",
      href: `/admin/compose?type=now&slug=${encodeURIComponent(
        entry.slug || entry.id,
      )}`,
      publicHref: "/now",
    })),
  ]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${userName.split(" ")[0]}. Here is where things stand.`}
        actions={
          <Button
            variant="secondary"
            onClick={() => onNavigateTab("content")}
          >
            Open library
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        }
      />

      {/* Current status */}
      <section aria-labelledby="now-heading">
        <div className="rounded-xl border border-tinted/20 bg-night-soft p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="now-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-mid"
                >
                  Current status
                </h2>
                {latestNow && (
                  <span className="text-[11px] text-gray-mid">
                    · {latestNow.date ? formatDisplayDate(latestNow.date) : "Today"}
                  </span>
                )}
              </div>
              {latestNow ? (
                <p className="mt-2 line-clamp-3 max-w-2xl font-serif text-lg leading-relaxed text-paper">
                  {stripMarkdown(latestNow.content || latestNow.title || "")}
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-mid">
                  No current status yet. Add one to tell readers what you are
                  doing now.
                </p>
              )}
            </div>

            <Link
              href={
                latestNow
                  ? `/admin/compose?type=now&slug=${encodeURIComponent(
                      latestNow.slug || latestNow.id,
                    )}`
                  : "/admin/compose?type=now"
              }
              className={buttonClassName(latestNow ? "secondary" : "primary")}
            >
              {latestNow ? "Edit status" : "Add status"}
            </Link>
          </div>
        </div>
      </section>

      {/* Basic counts */}
      <section aria-label="Publishing counts" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CountStat
          label="Published essays"
          value={publishedPosts.length}
          onClick={() => onNavigateTab("content")}
        />
        <CountStat
          label="Published notes"
          value={publishedNotes.length}
          onClick={() => onNavigateTab("content")}
        />
        <CountStat
          label="Books on shelf"
          value={publishedBooks.length}
          onClick={() => onNavigateTab("content")}
        />
        <CountStat
          label="Active subscribers"
          value={activeSubscribers.length}
          onClick={() => onNavigateTab("subscribers")}
        />
      </section>

      {/* Continue writing */}
      <section aria-labelledby="drafts-heading" className="space-y-3">
        <SectionHeading
          title="Continue writing"
          action={
            <button
              type="button"
              onClick={() => onNavigateTab("content")}
              className="text-xs text-gray-mid transition-colors hover:text-paper"
            >
              View drafts
            </button>
          }
        />
        {drafts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-tinted/30 px-4 py-6 text-sm text-gray-mid">
            Nothing in progress. Start a new essay or note from{" "}
            <button
              type="button"
              onClick={() => onNavigateTab("content")}
              className="text-accent hover:underline"
            >
              the library
            </button>
            .
          </p>
        ) : (
          <div className="divide-y divide-tinted/15 rounded-xl border border-tinted/20 bg-night-soft">
            {drafts.map((draft) => (
              <Link
                key={draft.id}
                href={draft.href}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-post-card/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ComposeIcon className="h-4 w-4 shrink-0 text-gray-mid" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-paper">{draft.title}</p>
                    <p className="mt-0.5 text-xs text-gray-mid">
                      Draft · last edited{" "}
                      {draft.date ? formatDisplayDate(draft.date) : "recently"}
                    </p>
                  </div>
                </div>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-mid" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section aria-labelledby="activity-heading" className="space-y-3">
        <SectionHeading
          title="Recent activity"
          action={
            <button
              type="button"
              onClick={() => onNavigateTab("content")}
              className="text-xs text-gray-mid transition-colors hover:text-paper"
            >
              All content
            </button>
          }
        />
        {activity.length === 0 ? (
          <p className="rounded-xl border border-dashed border-tinted/30 px-4 py-6 text-sm text-gray-mid">
            Nothing published yet. Your latest edits will show up here.
          </p>
        ) : (
          <ul className="divide-y divide-tinted/15 rounded-xl border border-tinted/20 bg-night-soft">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-post-card/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-14 shrink-0">
                    <TypeBadge kind={item.kind} />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={item.href}
                      className="block truncate text-sm text-paper transition-colors hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    {item.subtitle && (
                      <p className="mt-0.5 truncate text-xs text-gray-mid">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-[11px] text-gray-mid sm:inline">
                    {item.date ? formatDisplayDate(item.date) : ""}
                  </span>
                  <StatusBadge status={item.ok ? "published" : "draft"} />
                  {item.publicHref && (
                    <Link
                      href={item.publicHref}
                      target="_blank"
                      aria-label={`View ${item.title} on the public site`}
                      className="rounded p-1 text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
