"use client";

import { useState, useTransition } from "react";
import type { NewsletterSubscriber } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import { deleteSubscriberAction } from "@/app/admin/actions";
import {
  NoContentState,
  NoSearchResults,
} from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";
import { DownloadIcon, SearchIcon, TrashIcon } from "@/components/icons";
import {
  Badge,
  Button,
  CountStat,
  PageHeader,
  StatusBadge,
  TextInput,
} from "./ui";

interface SubscriberManagerProps {
  initialSubscribers: NewsletterSubscriber[];
}

export function SubscriberManager({
  initialSubscribers,
}: SubscriberManagerProps) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(
    initialSubscribers || [],
  );
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [subscriberToDelete, setSubscriberToDelete] =
    useState<NewsletterSubscriber | null>(null);

  const term = search.toLowerCase().trim();
  const filtered = subscribers.filter((subscriber) =>
    subscriber.email.toLowerCase().includes(term),
  );
  const activeCount = subscribers.filter(
    (subscriber) => subscriber.status === "active",
  ).length;

  function exportCSV() {
    if (subscribers.length === 0) return;
    const headers = ["Email", "Status", "Source", "Joined Date"];
    const rows = subscribers.map((subscriber) => [
      `"${subscriber.email.replace(/"/g, '""')}"`,
      `"${subscriber.status}"`,
      `"${subscriber.source || "website"}"`,
      `"${subscriber.createdAt}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.info("Subscriber list exported as CSV.");
  }

  function handleConfirmDelete() {
    if (!subscriberToDelete) return;
    const { id, email } = subscriberToDelete;

    startTransition(async () => {
      try {
        const result = await deleteSubscriberAction(id);
        if (result.success) {
          setSubscribers((previous) =>
            previous.filter((subscriber) => subscriber.id !== id),
          );
          setSubscriberToDelete(null);
          toast.success("Subscriber removed successfully.");
        } else {
          toast.error(
            result.error || "Failed to remove subscriber. Please try again.",
          );
        }
      } catch {
        toast.error("Failed to remove subscriber. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audience"
        description="Everyone who subscribed to the newsletter."
        actions={
          <Button
            variant="primary"
            onClick={exportCSV}
            disabled={subscribers.length === 0}
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        }
      />

      <section
        aria-label="Audience counts"
        className="grid grid-cols-2 gap-3 sm:max-w-md"
      >
        <CountStat label="Total subscribers" value={subscribers.length} />
        <CountStat label="Active subscribers" value={activeCount} />
      </section>

      {subscribers.length > 0 && (
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-mid" />
          <TextInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by email…"
            aria-label="Search subscribers by email"
            className="pl-9"
          />
        </div>
      )}

      {subscribers.length === 0 ? (
        <NoContentState
          title="No subscribers yet"
          description="When visitors sign up from the homepage or about page, their email addresses will appear here."
        />
      ) : filtered.length === 0 ? (
        <NoSearchResults query={search} onReset={() => setSearch("")} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-tinted/20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-tinted/20 bg-night-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Source
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Joined
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Status
                  </th>
                  <th className="w-12 px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tinted/15">
                {filtered.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="group transition-colors hover:bg-post-card/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-paper">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-gray-mid">
                      {subscriber.source || "website"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-mid">
                      {formatDisplayDate(subscriber.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={subscriber.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSubscriberToDelete(subscriber)}
                        disabled={isPending}
                        aria-label={`Remove ${subscriber.email}`}
                        title="Remove subscriber"
                        className="rounded-md p-1.5 text-gray-mid opacity-0 transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-tinted/20 bg-night-soft/40 px-4 py-2 text-[11px] text-gray-mid">
            <span>
              {filtered.length} of {subscribers.length} subscribers
            </span>
            <Badge tone="grey">{activeCount} active</Badge>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(subscriberToDelete)}
        onClose={() => setSubscriberToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isPending}
        title="Remove subscriber?"
        description={
          subscriberToDelete ? (
            <>
              Remove <b className="text-paper">{subscriberToDelete.email}</b>{" "}
              from the newsletter list? They will stop receiving future issues.
            </>
          ) : null
        }
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
