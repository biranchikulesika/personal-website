'use client';

import { useState } from 'react';
import type { AdminProfile } from '@/lib/types';
import {
  EnvelopeIcon,
  FingerprintIcon,
  LaptopIcon,
  TrashIcon,
  GitHubIcon,
  GoogleIcon,
} from '@/components/icons';

interface AccountManagerProps {
  initialProfile: AdminProfile;
}

interface Passkey {
  id: string;
  label: string;
  lastUsedAt: string;
}

interface ConnectedAccount {
  id: string;
  label: string;
  Icon: (props: { className?: string }) => React.JSX.Element;
}

interface Session {
  id: string;
  device: string;
  location: string;
  startedAt: string;
}

const CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'github', label: 'GitHub', Icon: GitHubIcon },
];

function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'This device';
  const ua = navigator.userAgent;
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Mac')) return 'MacBook';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Linux')) return 'Linux Computer';
  return 'This device';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper text-ink-soft ring-1 ring-tinted">
      {children}
    </span>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
      {title}
    </h3>
  );
}

export function AccountManager({ initialProfile }: AccountManagerProps) {
  const [passkeys, setPasskeys] = useState<Passkey[]>([
    { id: 'pk-1', label: 'Linux Computer', lastUsedAt: 'Aug 14, 2026' },
  ]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([
    'google',
  ]);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 's-1',
      device: 'Linux / Chrome',
      location: '127.0.0.1',
      startedAt: 'Just now',
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleAddPasskey() {
    if (isRegistering) return;
    setIsRegistering(true);
    setTimeout(() => {
      const label = getDeviceLabel();
      setPasskeys((prev) => [
        ...prev,
        {
          id: `pk-${Date.now()}`,
          label,
          lastUsedAt: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        },
      ]);
      setIsRegistering(false);
      showToast(`Passkey added for ${label}`);
    }, 800);
  }

  function handleRemovePasskey(id: string) {
    setPasskeys((prev) => prev.filter((p) => p.id !== id));
    showToast('Passkey removed');
  }

  function handleConnect(providerId: string) {
    if (pendingProvider) return;
    setPendingProvider(providerId);
    setTimeout(() => {
      setConnectedProviders((prev) => [...prev, providerId]);
      setPendingProvider(null);
      showToast(
        `${CONNECTED_ACCOUNTS.find((p) => p.id === providerId)?.label} connected`,
      );
    }, 800);
  }

  function handleDisconnect(providerId: string) {
    if (pendingProvider) return;
    setPendingProvider(providerId);
    setTimeout(() => {
      setConnectedProviders((prev) => prev.filter((id) => id !== providerId));
      setPendingProvider(null);
      showToast(
        `${CONNECTED_ACCOUNTS.find((p) => p.id === providerId)?.label} disconnected`,
      );
    }, 800);
  }

  function handleSignOutSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast('Session signed out');
  }

  function handleSignOutAll() {
    setSessions([]);
    showToast('Signed out of all sessions');
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-cream shadow-xl ring-1 ring-tinted animate-in fade-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-normal text-ink md:text-3xl">
          Account & Security
        </h2>
      </div>

      <div className="max-w-4xl space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* ── Sign-in & Authentication ── */}
          <section>
            <SectionHeading title="Sign-in & Authentication" />
            <div className="mt-3 divide-y divide-tinted/60 overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm">
              {/* Identity */}
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-cream">
                  {getInitials(initialProfile.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {initialProfile.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-soft">
                    <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
                    {initialProfile.email}
                  </p>
                </div>
              </div>

              {/* Passkeys header */}
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Passkeys
                </p>
                <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink ring-1 ring-tinted">
                  {passkeys.length}
                </span>
              </div>

              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconChip>
                      <FingerprintIcon className="h-4 w-4" />
                    </IconChip>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {passkey.label}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        Last used {passkey.lastUsedAt}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Remove passkey"
                    aria-label={`Remove ${passkey.label} passkey`}
                    onClick={() => handleRemovePasskey(passkey.id)}
                    className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {passkeys.length === 0 && (
                <div className="px-5 py-3">
                  <p className="text-xs text-ink-soft">
                    Add a passkey to sign in with your device instead of using a
                    password.
                  </p>
                </div>
              )}

              {/* Add passkey */}
              <div className="px-5 py-4">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={handleAddPasskey}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-xs font-semibold text-cream shadow-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <FingerprintIcon className="h-3.5 w-3.5" />
                  {isRegistering ? 'Creating passkey…' : 'Add passkey'}
                </button>
              </div>
            </div>
          </section>

          {/* ── Connected Accounts ── */}
          <section>
            <SectionHeading title="Connected Accounts" />
            <div className="mt-3 divide-y divide-tinted/60 overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm">
              {CONNECTED_ACCOUNTS.map((provider) => {
                const isConnected = connectedProviders.includes(provider.id);
                const isPending = pendingProvider === provider.id;
                const canDisconnect =
                  isConnected && connectedProviders.length > 1;

                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip>
                        <provider.Icon className="h-4 w-4" />
                      </IconChip>
                      <p className="text-sm font-medium text-ink">
                        {provider.label}
                      </p>
                    </div>

                    {isConnected ? (
                      canDisconnect ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDisconnect(provider.id)}
                          className="shrink-0 text-xs font-semibold text-red-700 transition-colors hover:text-red-800 disabled:cursor-wait disabled:opacity-50"
                        >
                          {isPending ? 'Disconnecting…' : 'Disconnect'}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          Connected
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleConnect(provider.id)}
                        className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPending ? 'Connecting…' : 'Connect'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── Active Sessions ── */}
        <section>
          <div className="flex items-center justify-between gap-3">
            <SectionHeading title="Active Sessions" />
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={handleSignOutAll}
                className="text-xs font-semibold text-ink-soft transition-colors hover:text-red-700"
              >
                Sign out all
              </button>
            )}
          </div>
          <div className="mt-3 divide-y divide-tinted/60 overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <IconChip>
                    <LaptopIcon className="h-4 w-4" />
                  </IconChip>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-medium text-ink">
                        {session.device}
                      </p>
                      <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink ring-1 ring-tinted">
                        This device
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {session.location} · Started {session.startedAt}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Active
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSignOutSession(session.id)}
                    className="text-xs font-semibold text-ink-soft transition-colors hover:text-red-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="px-5 py-4">
                <p className="text-xs text-ink-soft">
                  No active sessions. Sign in to see your devices here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}