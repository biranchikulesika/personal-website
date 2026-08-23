'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  EnvelopeIcon,
  FingerprintIcon,
  LaptopIcon,
  TrashIcon,
  GitHubIcon,
  GoogleIcon,
} from '@/components/icons';
import { NoContentState } from '@/components/ui/states';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { SITE_DOMAIN } from '@/lib/constants';
import {
  registerPasskeyAction,
  deletePasskeyAction,
  connectProviderAction,
  disconnectProviderAction,
  signOutSessionAction,
  signOutAllSessionsAction,
} from '@/app/admin/actions';
import type { PasskeyItem, UserSession } from '@/lib/types';

interface AccountManagerProps {
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  userRole: string;
  initialPasskeys?: PasskeyItem[];
  initialConnectedProviders?: string[];
  initialSessions?: UserSession[];
}

interface ConnectedAccount {
  id: 'google' | 'github';
  label: string;
  Icon: (props: { className?: string }) => React.JSX.Element;
}

const CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'github', label: 'GitHub', Icon: GitHubIcon },
];

function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'This device';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone Face ID';
  if (/iPad/i.test(ua)) return 'iPad Touch ID';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'MacBook Touch ID';
  if (/Windows/i.test(ua)) return 'Windows Hello';
  if (/Android/i.test(ua)) return 'Android Biometric';
  if (/Linux/i.test(ua)) return 'Linux Computer';
  return 'Security Key / Passkey';
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

export function AccountManager({
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
  initialPasskeys = [],
  initialConnectedProviders = ['google'],
  initialSessions = [],
}: AccountManagerProps) {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>(initialPasskeys);
  const [isRegistering, setIsRegistering] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<string[]>(
    initialConnectedProviders.length > 0 ? initialConnectedProviders : ['google'],
  );
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>(initialSessions);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const [signingOutSessionId, setSigningOutSessionId] = useState<string | null>(null);
  const { message: toastMessage, showToast } = useToast();

  async function handleAddPasskey() {
    if (isRegistering) return;
    setIsRegistering(true);
    const label = getDeviceLabel();

    try {
      let credentialId: string | undefined = undefined;

      // 1. Try Supabase browser client if configured
      const supabase = getSupabaseBrowser();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.registerPasskey();
          if (!error && data) {
            credentialId = (data as { id?: string })?.id;
          }
        } catch {
          // Fallback to standard WebAuthn
        }
      }

      // 2. Standard WebAuthn ceremony in browser
      if (
        !credentialId &&
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        navigator.credentials
      ) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const userIdBytes = new TextEncoder().encode(userEmail || 'admin');

          const credential = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: {
                name: 'Biranchi Kulesika Admin',
                id:
                  window.location.hostname === 'localhost'
                    ? undefined
                    : window.location.hostname,
              },
              user: {
                id: userIdBytes,
                name: userEmail || `admin@${SITE_DOMAIN}`,
                displayName: userName || 'Admin',
              },
              pubKeyCredParams: [
                { alg: -7, type: 'public-key' },
                { alg: -257, type: 'public-key' },
              ],
              timeout: 60000,
              authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
              },
              attestation: 'none',
            },
          });

          if (credential) {
            credentialId = credential.id;
          }
        } catch (webauthnErr: unknown) {
          const errName = (webauthnErr as { name?: string })?.name;
          if (errName === 'NotAllowedError' || errName === 'AbortError') {
            showToast('Passkey registration was cancelled.');
            setIsRegistering(false);
            return;
          }
        }
      }

      // 3. Persist via server action
      const result = await registerPasskeyAction({
        label,
        credentialId,
      });

      if (result.success && result.passkey) {
        setPasskeys((prev) => [
          result.passkey!,
          ...prev.filter((p) => p.id !== result.passkey!.id),
        ]);
        showToast(`Passkey added for ${label}`);
      } else {
        showToast(result.error || 'Failed to add passkey');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to register passkey');
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleRemovePasskey(id: string) {
    try {
      const result = await deletePasskeyAction(id);
      if (result.success) {
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
        showToast('Passkey removed');
      } else {
        showToast(result.error || 'Failed to remove passkey');
      }
    } catch {
      showToast('Failed to remove passkey');
    }
  }

  async function handleConnect(providerId: 'google' | 'github') {
    if (pendingProvider) return;
    setPendingProvider(providerId);
    try {
      const result = await connectProviderAction(providerId);
      if (result.success) {
        if (result.url) {
          window.location.href = result.url;
          return;
        }
        setConnectedProviders((prev) =>
          prev.includes(providerId) ? prev : [...prev, providerId],
        );
        showToast(
          `${CONNECTED_ACCOUNTS.find((p) => p.id === providerId)?.label} connected`,
        );
      } else {
        showToast(result.error || 'Failed to connect provider');
      }
    } catch {
      showToast('Failed to connect provider');
    } finally {
      setPendingProvider(null);
    }
  }

  async function handleDisconnect(providerId: 'google' | 'github') {
    if (pendingProvider) return;
    if (connectedProviders.length <= 1) {
      showToast(
        'At least one authentication provider must remain connected to prevent lockout.',
      );
      return;
    }
    setPendingProvider(providerId);
    try {
      const result = await disconnectProviderAction(providerId);
      if (result.success) {
        setConnectedProviders((prev) =>
          prev.filter((id) => id !== providerId),
        );
        showToast(
          `${CONNECTED_ACCOUNTS.find((p) => p.id === providerId)?.label} disconnected`,
        );
      } else {
        showToast(result.error || 'Failed to disconnect provider');
      }
    } catch {
      showToast('Failed to disconnect provider');
    } finally {
      setPendingProvider(null);
    }
  }

  async function handleSignOutSession(id: string) {
    if (signingOutSessionId) return;
    setSigningOutSessionId(id);
    try {
      const result = await signOutSessionAction(id);
      if (result.success) {
        if (result.redirect) {
          window.location.href = result.redirect;
          return;
        }
        setSessions((prev) => prev.filter((s) => s.id !== id));
        showToast('Session signed out');
      } else {
        showToast(result.error || 'Failed to sign out session');
      }
    } catch {
      showToast('Failed to sign out session');
    } finally {
      setSigningOutSessionId(null);
    }
  }

  async function handleSignOutAll() {
    if (isSigningOutAll) return;
    setIsSigningOutAll(true);
    try {
      const result = await signOutAllSessionsAction();
      if (result.success) {
        showToast('Signed out of all sessions');
        window.location.href = result.redirect || '/admin/login';
      } else {
        showToast(result.error || 'Failed to sign out all sessions');
        setIsSigningOutAll(false);
      }
    } catch {
      showToast('Failed to sign out all sessions');
      setIsSigningOutAll(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl">
          Account & Security
        </h2>
      </div>

      <div className="max-w-5xl space-y-6 sm:space-y-8">
        {/* ── Identity with Profile Picture ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-tinted/20 bg-post-card p-4 sm:p-6 shadow-sm transition-all hover:border-tinted/30">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <UserAvatar
              src={userAvatarUrl}
              name={userName}
              size={56}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-serif text-lg sm:text-xl font-medium text-paper">
                  {userName}
                </p>
                <span className="rounded-full bg-night-soft px-2.5 py-0.5 text-[10px] font-semibold text-gray-mid border border-tinted/20 capitalize tracking-wide">
                  {userRole.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-mid">
                <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{userEmail || `admin@${SITE_DOMAIN}`}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 2-Column Grid for Authentication & Connected Accounts ── */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {/* ── Sign-in & Authentication ── */}
          <section className="flex flex-col">
            <SectionHeading title="Sign-in & Authentication" />
            <div className="mt-3 flex flex-1 flex-col justify-between divide-y divide-tinted/20 overflow-hidden rounded-2xl border border-tinted/20 bg-post-card shadow-sm">
              <div>
                {/* Passkeys header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-night-soft/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Passkeys
                  </p>
                  <span className="rounded-full bg-night px-2 py-0.5 text-[10px] font-semibold text-paper border border-tinted/20">
                    {passkeys.length}
                  </span>
                </div>

                {/* Passkeys List */}
                <div className="divide-y divide-tinted/20">
                  {passkeys.map((passkey) => (
                    <div
                      key={passkey.id}
                      className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 transition-colors hover:bg-night-soft/30"
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
                        className="shrink-0 rounded-full p-2 text-gray-mid transition-colors hover:bg-red-950/40 hover:text-red-400 active:scale-95"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {passkeys.length === 0 && (
                    <NoContentState
                      compact
                      title="No passkeys registered"
                      description="Add a passkey to sign in with your device biometrics or security key."
                    />
                  )}
                </div>
              </div>

              {/* Add passkey */}
              <div className="p-4 sm:p-5 bg-night-soft/20">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={handleAddPasskey}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-xs font-semibold text-paper shadow-sm transition-all hover:bg-accent-hover active:scale-98 disabled:opacity-50"
                >
                  <FingerprintIcon className="h-3.5 w-3.5" />
                  <span>{isRegistering ? 'Creating passkey…' : 'Add passkey'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── Connected Accounts ── */}
          <section className="flex flex-col">
            <SectionHeading title="Connected Accounts" />
            <div className="mt-3 flex flex-1 flex-col divide-y divide-tinted/20 overflow-hidden rounded-2xl border border-tinted/20 bg-post-card shadow-sm">
              {CONNECTED_ACCOUNTS.map((provider) => {
                const isConnected = connectedProviders.includes(provider.id);
                const isPending = pendingProvider === provider.id;
                const canDisconnect =
                  isConnected && connectedProviders.length > 1;

                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 transition-colors hover:bg-night-soft/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip>
                        <provider.Icon className="h-4 w-4" />
                      </IconChip>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-paper">
                          {provider.label}
                        </p>
                        {isConnected && !canDisconnect && (
                          <p className="text-[10px] text-gray-mid">
                            Primary login provider
                          </p>
                        )}
                      </div>
                    </div>

                    {isConnected ? (
                      canDisconnect ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDisconnect(provider.id)}
                          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 disabled:cursor-wait disabled:opacity-50 active:scale-95"
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
                        className="shrink-0 rounded-full bg-night-soft border border-tinted/20 px-3 py-1 text-xs font-semibold text-paper transition-all hover:bg-accent hover:border-accent disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
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
                disabled={isSigningOutAll}
                onClick={handleSignOutAll}
                className="rounded-full px-3 py-1 text-xs font-semibold text-gray-mid border border-tinted/20 hover:border-red-500/30 hover:bg-red-950/30 hover:text-red-400 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSigningOutAll ? 'Signing out all…' : 'Sign out all'}
              </button>
            )}
          </div>
          <div className="mt-3 divide-y divide-tinted/20 overflow-hidden rounded-2xl border border-tinted/20 bg-post-card shadow-sm">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 transition-colors hover:bg-night-soft/30"
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
                      {session.isCurrent && (
                        <span className="rounded-full bg-night px-2 py-0.5 text-[10px] font-semibold text-teal border border-tinted/20">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-mid">
                      {session.location} · Started {session.startedAt}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                  <button
                    type="button"
                    disabled={signingOutSessionId === session.id}
                    onClick={() => handleSignOutSession(session.id)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-mid hover:bg-red-950/40 hover:text-red-400 transition-colors disabled:opacity-50 active:scale-95"
                  >
                    {signingOutSessionId === session.id ? 'Signing out…' : 'Sign out'}
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