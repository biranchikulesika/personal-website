"use client";

import type {
  BlogPost,
  BookItem,
  MediaItem,
  NewsletterSubscriber,
  NoteItem,
  NowEntry,
  PasskeyItem,
} from "@/lib/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { toast } from "@/lib/toast";
import {
  Button,
  Card,
  PageHeader,
  SectionHeading,
  StatusBadge,
} from "./ui";
import { AccountManager } from "./account-manager";
import { DownloadIcon } from "@/components/icons";

interface SettingsManagerProps {
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userRole: string;
  initialPasskeys?: PasskeyItem[];
  initialConnectedProviders?: string[];
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
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account, security, and data."
      />

      <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Account summary */}
          <section>
            <SectionHeading title="Account" />
            <Card className="mt-2">
              <div className="flex items-start gap-3">
                <UserAvatar src={userAvatarUrl} name={userName} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-paper">
                      {userName}
                    </p>
                    <StatusBadge status="active" />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-mid">
                    {userEmail}
                  </p>
                  <p className="mt-1 text-[11px] capitalize tracking-wide text-gray-mid">
                    {userRole.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Data */}
          <section>
            <SectionHeading title="Your data" />
            <Card className="mt-2">
              <p className="text-xs leading-relaxed text-gray-mid">
                Download every essay, note, book, Now entry, media record, and
                subscriber as JSON.
              </p>
              <Button
                variant="secondary"
                onClick={handleExport}
                className="mt-3 w-full"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export data
              </Button>
            </Card>
          </section>
        </aside>

        <div className="min-w-0">
          <AccountManager
            showIdentity={false}
            userName={userName}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
            userRole={userRole}
            initialPasskeys={initialPasskeys}
            initialConnectedProviders={initialConnectedProviders}
          />
        </div>
      </div>
    </div>
  );
}
