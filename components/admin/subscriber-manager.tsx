"use client";

import { useState, useEffect, useTransition } from "react";
import type { NewsletterSubscriber } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { deleteSubscriberAction } from "@/app/admin/actions";
import { NoContentState } from "@/components/ui/states";

interface SubscriberManagerProps {
  initialSubscribers: NewsletterSubscriber[];
}

export function SubscriberManager({
  initialSubscribers,
}: SubscriberManagerProps) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(
    initialSubscribers || []
  );
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Auto-dismiss feedback after a few seconds.
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase().trim())
  );

  function exportCSV() {
    if (subscribers.length === 0) return;
    const headers = ["Email", "Status", "Source", "Joined Date"];
    const rows = subscribers.map((s) => [
      `"${s.email.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${s.source || "website"}"`,
      `"${s.createdAt}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDelete(id: string, email: string) {
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;

    startTransition(async () => {
      try {
        const res = await deleteSubscriberAction(id);
        if (res.success) {
          setSubscribers((prev) => prev.filter((s) => s.id !== id));
          setFeedback({ type: "success", text: `Removed ${email}` });
        } else {
          setFeedback({ type: "error", text: res.error || "Failed to remove subscriber" });
        }
      } catch {
        setFeedback({ type: "error", text: "Something went wrong. Please try again." });
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-tinted/15 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-normal text-paper md:text-4xl">
            Newsletter Subscribers
          </h1>
          <p className="mt-2 text-xs text-gray-mid tracking-wide">
            {subscribers.length} total subscribers · {subscribers.filter((s) => s.status === "active").length} active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCSV}
            disabled={subscribers.length === 0}
            className="rounded-full border border-tinted/20 bg-night-soft px-4 py-2 text-xs font-medium text-paper hover:bg-tinted/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 text-xs rounded-xl border ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/20 bg-rose-500/10 text-rose-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Search Filter */}
      {subscribers.length > 0 && (
        <div className="flex items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter subscribers by email…"
            aria-label="Filter subscribers"
            className="w-full sm:max-w-md rounded-full border border-tinted/20 bg-night-soft px-4 py-2 text-xs text-paper placeholder:text-ink-soft/60 focus:border-tinted/40 focus:outline-none"
          />
        </div>
      )}

      {/* List */}
      {subscribers.length === 0 ? (
        <NoContentState
          title="No subscribers yet"
          description="When visitors sign up from the homepage or about page, their email addresses will appear here."
        />
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-mid py-8">
          No subscribers found matching &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="divide-y divide-tinted/10 border-y border-tinted/10">
          {filtered.map((subscriber) => (
            <div
              key={subscriber.id}
              className="flex items-center justify-between py-4 group"
            >
              <div className="min-w-0 pr-4">
                <p className="text-sm font-mono text-paper truncate">
                  {subscriber.email}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-mid">
                  <span>Joined {formatDisplayDate(subscriber.createdAt)}</span>
                  <span>·</span>
                  <span className="capitalize">{subscriber.source || "website"}</span>
                  <span>·</span>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      subscriber.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-gray-mid/20 text-gray-mid"
                    }`}
                  >
                    {subscriber.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(subscriber.id, subscriber.email)}
                  disabled={isPending}
                  aria-label={`Remove ${subscriber.email}`}
                  className="rounded-full px-3 py-1 text-xs text-gray-mid hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
