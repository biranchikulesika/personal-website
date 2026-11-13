'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  MailIcon,
  FingerprintIcon,
  LaptopIcon,
  TrashIcon,
  GitHubIcon,
  GoogleIcon,
} from '@/components/icons';
import { SITE_DOMAIN } from '@/lib/constants';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import {
  startPasskeyRegistrationAction,
  verifyPasskeyRegistrationAction,
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

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-night-soft text-gray-mid border border-tinted/20">
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
  const [passkeyToDelete, setPasskeyToDelete] = useState<PasskeyItem | null>(null);
  const [sessionToSignOut, setSessionToSignOut] = useState<UserSession | null>(null);
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const { message: toastMessage, showToast } = useToast();

  async function handleAddPasskey() {
    if (isRegistering) return;
    setIsRegistering(true);
    const label = getDeviceLabel();

    try {
      if (!browserSupportsWebAuthn()) {
        showToast('WebAuthn / Passkeys are not supported by this browser.');
        setIsRegistering(false);
        return;
      }

      // 1. Fetch server registration options
      const optResult = await startPasskeyRegistrationAction();
      if (!optResult.success || !optResult.options) {
        showToast(optResult.error || 'Failed to initialize passkey registration');
        setIsRegistering(false);
        return;
      }

      // 2. Perform WebAuthn registration ceremony in browser
      let regResponse;
      try {
        regResponse = await startRegistration({
          optionsJSON: optResult.options,
        });
      } catch (webauthnErr: unknown) {
        const errName = (webauthnErr as { name?: string })?.name;
        if (errName === 'NotAllowedError' || errName === 'AbortError') {
          showToast('Passkey registration was cancelled.');
          setIsRegistering(false);
          return;
        }
        throw webauthnErr;
      }

      // 3. Cryptographically verify and persist credential on server
      const verifyResult = await verifyPasskeyRegistrationAction({
        response: regResponse,
        label,
      });

      if (verifyResult.success && verifyResult.passkey) {
        setPasskeys((prev) => [
          verifyResult.passkey!,
          ...prev.filter((p) => p.id !== verifyResult.passkey!.id),
        ]);
        showToast(`Passkey registered: ${label}`);
      } else {
        showToast(verifyResult.error || 'Failed to verify and save passkey');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to register passkey');
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleConfirmRemovePasskey() {
    if (!passkeyToDelete) return;
    const { id } = passkeyToDelete;
    try {
      const result = await deletePasskeyAction(id);
      if (result.success) {
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
        setPasskeyToDelete(null);
        showToast('Passkey removed successfully.', 'success');
      } else {
        showToast(result.error || 'Failed to remove passkey. Please try again.', 'error');
      }
    } catch {
      showToast('Failed to remove passkey. Please try again.', 'error');
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
          `${CONNECTED_ACCOUNTS.find((p) => p.id === providerId)?.label} connected successfully.`,
          'success',
        );
      } else {
        showToast(result.error || 'Failed to connect provider', 'error');
      }
    } catch {
      showToast('Failed to connect provider. Please try again.', 'error');
    } finally {
      setPendingProvider(null);
    }
  }

  async function handleDisconnect(providerId: 'google' | 'github') {
    if (pendingProvider) return;
    if (connectedProviders.length <= 1) {
      showToast(
        'At least one authentication provider must remain connected to prevent lockout.',
        'warning',
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
          `${CONNECTED_ACCOUNTS.find((p) => p.id === providerId)?.label} disconnected successfully.`,
          'success',
        );
      } else {
        showToast(result.error || 'Failed to disconnect provider', 'error');
      }
    } catch {
      showToast('Failed to disconnect provider. Please try again.', 'error');
    } finally {
      setPendingProvider(null);
    }
  }

  async function handleConfirmSignOutSession() {
    if (!sessionToSignOut) return;
    const { id } = sessionToSignOut;
    setSigningOutSessionId(id);
    try {
      const result = await signOutSessionAction(id);
      if (result.success) {
        if (result.redirect) {
          window.location.href = result.redirect;
          return;
        }
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setSessionToSignOut(null);
        showToast('Session signed out successfully.', 'success');
      } else {
        showToast(result.error || 'Failed to sign out session', 'error');
      }
    } catch {
      showToast('Failed to sign out session. Please try again.', 'error');
    } finally {
      setSigningOutSessionId(null);
    }
  }

  async function handleConfirmSignOutAll() {
    if (isSigningOutAll) return;
    setIsSigningOutAll(true);
    try {
      const result = await signOutAllSessionsAction();
      if (result.success) {
        showToast('Signed out of all sessions successfully.', 'success');
        window.location.href = result.redirect || '/admin/login';
      } else {
        showToast(result.error || 'Failed to sign out all sessions', 'error');
        setIsSigningOutAll(false);
      }
    } catch {
      showToast('Failed to sign out all sessions. Please try again.', 'error');
      setIsSigningOutAll(false);
    }
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      {/* Identity row (title lives in the dialog header) */}
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar src={userAvatarUrl} name={userName} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-paper">
              {userName}
            </p>
            <span className="rounded-full border border-tinted/20 bg-night-soft px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide text-gray-mid">
              {userRole.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-gray-mid">
            <MailIcon className="h-3 w-3 shrink-0" />
            <span>{userEmail || `admin@${SITE_DOMAIN}`}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── 2-Column Grid for Authentication & Connected Accounts ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* ── Sign-in & Authentication ── */}
          <section className="flex flex-col">
            <SectionHeading title="Sign-in & Authentication" />
            <div className="mt-2 flex flex-1 flex-col justify-between divide-y divide-tinted/20 overflow-hidden rounded-xl border border-tinted/20 bg-post-card">
              <div>
                {/* Passkeys header */}
                <div className="flex items-center justify-between bg-night-soft/40 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                    Passkeys
                  </p>
                  <span className="rounded-full border border-tinted/20 bg-night px-2 py-0.5 text-[10px] font-semibold text-paper">
                    {passkeys.length}
                  </span>
                </div>

                {/* Passkeys List */}
                <div className="divide-y divide-tinted/20">
                  {passkeys.map((passkey) => (
                    <div
                      key={passkey.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-night-soft/30"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <IconChip>
                          <FingerprintIcon className="h-4 w-4 text-teal" />
                        </IconChip>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-paper">
                            {passkey.label}
                          </p>
                          <p className="text-[11px] text-gray-mid">
                            Last used {passkey.lastUsedAt}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        title="Remove passkey"
                        aria-label={`Remove ${passkey.label} passkey`}
                        onClick={() => setPasskeyToDelete(passkey)}
                        className="shrink-0 rounded-full p-1.5 text-gray-mid transition-colors hover:bg-red-950/40 hover:text-red-400 active:scale-95"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {passkeys.length === 0 && (
                    <p className="px-3 py-3 text-[11px] text-gray-mid">
                      No passkeys registered yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Add passkey */}
              <div className="p-2.5">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={handleAddPasskey}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-2 text-xs font-semibold text-paper shadow-sm transition-all hover:bg-accent-hover active:scale-98 disabled:opacity-50"
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
            <div className="mt-2 flex flex-1 flex-col divide-y divide-tinted/20 overflow-hidden rounded-xl border border-tinted/20 bg-post-card">
              {CONNECTED_ACCOUNTS.map((provider) => {
                const isConnected = connectedProviders.includes(provider.id);
                const isPending = pendingProvider === provider.id;
                const canDisconnect =
                  isConnected && connectedProviders.length > 1;

                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-night-soft/30"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <IconChip>
                        <provider.Icon className="h-4 w-4" />
                      </IconChip>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-paper">
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
                          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 disabled:cursor-wait disabled:opacity-50 active:scale-95"
                        >
                          {isPending ? 'Disconnecting…' : 'Disconnect'}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-full border border-emerald-800/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          Connected
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleConnect(provider.id)}
                        className="shrink-0 rounded-full border border-tinted/20 bg-night-soft px-2.5 py-1 text-[11px] font-semibold text-paper transition-all hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
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
                onClick={() => setConfirmSignOutAll(true)}
                className="rounded-full border border-tinted/20 px-2.5 py-0.5 text-[11px] font-semibold text-gray-mid transition-all hover:border-red-500/30 hover:bg-red-950/30 hover:text-red-400 disabled:opacity-50 active:scale-95"
              >
                {isSigningOutAll ? 'Signing out all…' : 'Sign out all'}
              </button>
            )}
          </div>
          <div className="mt-2 divide-y divide-tinted/20 overflow-hidden rounded-xl border border-tinted/20 bg-post-card">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-night-soft/30"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <IconChip>
                    <LaptopIcon className="h-4 w-4 text-teal" />
                  </IconChip>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="truncate text-xs font-medium text-paper">
                        {session.device}
                      </p>
                      {session.isCurrent && (
                        <span className="rounded-full border border-tinted/20 bg-night px-1.5 py-0.5 text-[10px] font-semibold text-teal">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-gray-mid">
                      {session.location} · Started {session.startedAt}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden items-center gap-1 text-[10px] font-semibold text-emerald-400 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                  <button
                    type="button"
                    disabled={signingOutSessionId === session.id}
                    onClick={() => setSessionToSignOut(session)}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-mid transition-colors hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50 active:scale-95"
                  >
                    {signingOutSessionId === session.id ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="px-3 py-3 text-[11px] text-gray-mid">
                No active sessions.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Remove Passkey Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(passkeyToDelete)}
        onClose={() => setPasskeyToDelete(null)}
        onConfirm={handleConfirmRemovePasskey}
        title="Remove Passkey?"
        description={
          passkeyToDelete ? (
            <>
              Are you sure you want to remove the passkey{" "}
              <b className="text-paper">{passkeyToDelete.label}</b>? You won&apos;t
              be able to use it to sign in.
            </>
          ) : null
        }
        confirmLabel="Remove"
        variant="danger"
      />

      {/* Revoke Session Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(sessionToSignOut)}
        onClose={() => setSessionToSignOut(null)}
        onConfirm={handleConfirmSignOutSession}
        isLoading={Boolean(signingOutSessionId)}
        title="Revoke Session?"
        description={
          sessionToSignOut ? (
            <>
              Are you sure you want to sign out of the session on{" "}
              <b className="text-paper">{sessionToSignOut.device}</b> (
              {sessionToSignOut.location})?
            </>
          ) : null
        }
        confirmLabel="Sign Out"
        variant="warning"
      />

      {/* Sign Out All Sessions Confirmation */}
      <ConfirmDialog
        isOpen={confirmSignOutAll}
        onClose={() => setConfirmSignOutAll(false)}
        onConfirm={handleConfirmSignOutAll}
        isLoading={isSigningOutAll}
        title="Sign Out All Other Sessions?"
        description="Are you sure you want to sign out of all active sessions across all devices? You will be returned to the login screen."
        confirmLabel="Sign Out All"
        variant="warning"
      />
    </div>
  );
}