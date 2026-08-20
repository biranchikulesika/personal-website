'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';

import {
  EnvelopeIcon,
  FingerprintIcon,
  LaptopIcon,
  TrashIcon,
  GitHubIcon,
  GoogleIcon,
} from '@/components/icons';
import { NoContentState } from '@/components/ui/states';

interface AccountManagerProps {
  userName: string;
  userEmail: string;
  userRole: string;
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
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-night-soft text-gray-mid border border-tinted/20">
      {children}
    </span>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
      {title}
    </h3>
  );
}

export function AccountManager({ userName, userEmail, userRole }: AccountManagerProps) {
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
  const { message: toastMessage, showToast } = useToast();

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
    <div className="space-y-8 font-sans">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl">
          Account & Security
        </h2>
      </div>

      <div className="max-w-4xl space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* ── Sign-in & Authentication ── */}
          <section>
            <SectionHeading title="Sign-in & Authentication" />
            <div className="mt-3 divide-y divide-tinted/20 overflow-hidden rounded-2xl border border-tinted/20 bg-post-card shadow-sm">
              {/* Identity */}
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-paper">
                  {getInitials(userName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-paper">
                    {userName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-mid">
                    <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
                    {userEmail}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-mid capitalize">
                    {userRole.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Passkeys header */}
              <div className="flex items-center justify-between px-5 py-3 bg-night-soft/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
                  Passkeys
                </p>
                <span className="rounded-full bg-night px-2 py-0.5 text-[10px] font-semibold text-paper border border-tinted/20">
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
                      <FingerprintIcon className="h-4 w-4 text-teal" />
                    </IconChip>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-paper">
                        {passkey.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-mid">
                        Last used {passkey.lastUsedAt}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Remove passkey"
                    aria-label={`Remove ${passkey.label} passkey`}
                    onClick={() => handleRemovePasskey(passkey.id)}
                    className="shrink-0 rounded-full p-2 text-gray-mid transition-colors hover:bg-red-950/40 hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {passkeys.length === 0 && (
                <NoContentState
                  compact
                  title="No passkeys registered"
                  description="Add a passkey to sign in with your device instead of a password."
                />
              )}

              {/* Add passkey */}
              <div className="px-5 py-4">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={handleAddPasskey}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
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
            <div className="mt-3 divide-y divide-tinted/20 overflow-hidden rounded-2xl border border-tinted/20 bg-post-card shadow-sm">
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
                      <p className="text-sm font-medium text-paper">
                        {provider.label}
                      </p>
                    </div>

                    {isConnected ? (
                      canDisconnect ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDisconnect(provider.id)}
                          className="shrink-0 text-xs font-semibold text-red-400 transition-colors hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
                        >
                          {isPending ? 'Disconnecting…' : 'Disconnect'}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-full bg-emerald-950/60 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-800/40">
                          Connected
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleConnect(provider.id)}
                        className="shrink-0 rounded-full bg-night-soft border border-tinted/20 px-3 py-1 text-xs font-semibold text-paper transition-colors hover:bg-accent hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                className="text-xs font-semibold text-gray-mid transition-colors hover:text-red-400"
              >
                Sign out all
              </button>
            )}
          </div>
          <div className="mt-3 divide-y divide-tinted/20 overflow-hidden rounded-2xl border border-tinted/20 bg-post-card shadow-sm">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <IconChip>
                    <LaptopIcon className="h-4 w-4 text-teal" />
                  </IconChip>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-medium text-paper">
                        {session.device}
                      </p>
                      <span className="rounded-full bg-night px-2 py-0.5 text-[10px] font-semibold text-teal border border-tinted/20">
                        This device
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-mid">
                      {session.location} · Started {session.startedAt}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSignOutSession(session.id)}
                    className="text-xs font-semibold text-gray-mid transition-colors hover:text-red-400"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <NoContentState
                compact
                title="No active sessions"
                description="Sign in to see your active devices here."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}