'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { AdminProfile } from '@/lib/types';
import { updateAdminProfileAction } from '@/app/admin/actions';

interface AccountManagerProps {
  initialProfile: AdminProfile;
}

export function AccountManager({ initialProfile }: AccountManagerProps) {
  const [profile, setProfile] = useState<AdminProfile>(initialProfile);
  const [name, setName] = useState(initialProfile.name);
  const [email, setEmail] = useState(initialProfile.email);
  const [role, setRole] = useState(initialProfile.role);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAdminProfileAction({
        name,
        email,
        role,
        avatarUrl,
      });
      if (res.success && res.profile) {
        setProfile(res.profile);
        showToast('Admin profile updated successfully!');
      } else {
        showToast(res.error || 'Failed to update profile');
      }
    });
  }

  function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('New passwords do not match!');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Admin credentials updated (simulated for dev mode).');
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
          Admin Account & Login Management
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Manage your author identity, login credentials, and admin security settings.
        </p>
      </div>

      {/* Developer Mode Authentication Banner */}
      <div className="rounded-2xl border border-tinted bg-cream p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-accent shadow-xs ring-1 ring-tinted">
            <span className="font-mono text-base font-bold">⌘</span>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-medium text-ink">
                Authentication Status: Developer Mode
              </h3>
              <span className="rounded-full bg-paper px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent ring-1 ring-tinted">
                Auth Disabled (AGENTS.md)
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ink-soft md:text-sm">
              Per branch architecture rules, production authentication middleware is disabled. All admin operations are unblocked in development mode. When ready for production promotion, auth guards will attach seamlessly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Profile Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-tinted bg-cream p-6 sm:p-8 shadow-sm">
            <h3 className="font-serif text-xl font-normal text-ink">
              Author & Profile Identity
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              This information is associated with published essays and notes.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-tinted bg-paper shadow-sm">
                  <Image
                    src={avatarUrl || '/biranchi.jpeg'}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="mt-1 w-full max-w-sm rounded-xl border border-tinted bg-paper px-3 py-1.5 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Role / Description
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-cream shadow-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Security & Login Credentials (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Password Management */}
          <div className="rounded-3xl border border-tinted bg-cream p-6 sm:p-8 shadow-sm">
            <h3 className="font-serif text-xl font-normal text-ink">
              Admin Password
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              Update credentials for future authentication enforcement.
            </p>

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-paper py-2.5 text-xs font-semibold text-ink shadow-xs ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Security & Active Session Preview */}
          <div className="rounded-3xl border border-tinted bg-cream p-6 shadow-sm">
            <h3 className="font-serif text-lg font-normal text-ink">
              Security & Sessions
            </h3>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-paper p-3 ring-1 ring-tinted">
                <div>
                  <div className="text-xs font-medium text-ink">Two-Factor Authentication</div>
                  <div className="text-[11px] text-ink-soft">App-based TOTP code</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    showToast(
                      twoFactorEnabled
                        ? '2FA disabled for local mode'
                        : '2FA simulated enable for admin',
                    );
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    twoFactorEnabled
                      ? 'bg-ink text-cream'
                      : 'bg-paper text-ink-soft ring-1 ring-tinted hover:text-ink'
                  }`}
                >
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="rounded-xl bg-paper p-3 text-xs ring-1 ring-tinted">
                <div className="flex items-center justify-between font-medium text-ink">
                  <span>Current Local Session</span>
                  <span className="text-emerald-700">● Active</span>
                </div>
                <div className="mt-1 text-[11px] text-ink-soft">
                  Linux / Chrome • 127.0.0.1 • Started just now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
