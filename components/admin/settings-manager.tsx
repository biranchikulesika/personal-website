"use client";

import Link from "next/link";
import type {
  BlogPost,
  BookItem,
  MediaItem,
  NewsletterSubscriber,
  NoteItem,
  NowEntry,
  PasskeyItem,
  UserSession,
} from "@/lib/types";
import { SITE_URL } from "@/lib/constants";
import { UserAvatar } from "@/components/ui/user-avatar";
import { toast } from "@/lib/toast";
import { Button, PageHeader, SectionHeading, StatusBadge } from "./ui";
import { AccountManager } from "./account-manager";
import { DownloadIcon, ExternalLinkIcon } from "@/components/icons";

interface SettingsManagerProps {
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
  initialPasskeys?: PasskeyItem[];
  initialConnectedProviders?: string[];
  initialSessions?: UserSession[];
  exportData: {
    posts: BlogPost[];
    notes: NoteItem[];
    books: BookItem[];
    nowEntries: NowEntry[];
    media: MediaItem[];
    subscribers: NewsletterSubscriber[];
  };
}

export function SettingsManager({
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
  initialPasskeys = [],
  initialConnectedProviders = ["google"],
  initialSessions = [],
  exportData,
}: SettingsManagerProps) {
  function handleExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: { name: userName, email: userEmail, role: userRole },
      ...exportData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biranchi-admin-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Data export downloaded.");
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Settings"
        description="Your profile, sign-in methods, and active sessions."
      />

      {/* Profile */}
      <section aria-labelledby="profile-heading" className="space-y-3">
        <SectionHeading title="Profile" />
        <div className="rounded-xl border border-tinted/20 bg-night-soft p-4">
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatar src={userAvatarUrl} name={userName} size={56} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-medium text-paper">{userName}</p>
                <StatusBadge status="active" />
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-mid">{userEmail}</p>
              <p className="mt-1 text-xs capitalize text-gray-mid">
                {userRole.replace(/_/g, " ")}
              </p>
            </div>
            <Link
              href={SITE_URL}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-tinted/40 bg-night px-3 py-1.5 text-xs text-paper transition-colors hover:border-tinted/60 hover:bg-post-card"
            >
              View public site
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-4 border-t border-tinted/20 pt-3 text-xs text-gray-mid">
            Name, avatar, and email come from your sign-in provider. Update them
            there and they will appear here on next sign-in.
          </p>
        </div>
      </section>

      <AccountManager
        showIdentity={false}
        userName={userName}
        userEmail={userEmail}
        userAvatarUrl={userAvatarUrl}
        userRole={userRole}
        initialPasskeys={initialPasskeys}
        initialConnectedProviders={initialConnectedProviders}
        initialSessions={initialSessions}
      />

      {/* Data */}
      <section aria-labelledby="data-heading" className="space-y-3">
        <SectionHeading title="Your data" />
        <div className="rounded-xl border border-tinted/20 bg-night-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-paper">Export your data</p>
              <p className="mt-0.5 text-xs text-gray-mid">
                Download every essay, note, book, Now entry, media record, and
                subscriber as JSON.
              </p>
            </div>
            <Button variant="secondary" onClick={handleExport}>
              <DownloadIcon className="h-3.5 w-3.5" />
              Export data
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
