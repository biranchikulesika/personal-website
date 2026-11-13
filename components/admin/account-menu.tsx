'use client';

import { useRef, useState } from 'react';
import { logoutAction } from '@/app/admin/login/actions';
import { ChevronDownIcon, LogoutIcon, SettingsIcon } from '@/components/icons';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useClickOutside } from '@/components/ui/use-click-outside';
import { toast } from '@/lib/toast';

interface AccountMenuProps {
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  userRole: string;
  onOpenSettings: () => void;
}

/**
 * Sidebar account button: avatar + name that opens a popover with the signed-in
 * identity, a link to the Account settings tab, and sign out.
 */
export function AccountMenu({
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
  onOpenSettings,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsOpen(false);
    toast.info('Signing out…');
    await logoutAction();
    window.location.href = '/admin/login';
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors ${
          isOpen
            ? 'border-tinted/30 bg-post-card'
            : 'border-transparent hover:border-tinted/20 hover:bg-post-card/60'
        }`}
      >
        <UserAvatar src={userAvatarUrl} name={userName} size={34} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-paper">
            {userName}
          </span>
          <span className="block truncate text-[11px] capitalize text-gray-mid">
            {userRole.replace('_', ' ')}
          </span>
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-mid transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        role="menu"
        aria-label="Account menu"
        className={`absolute inset-x-0 top-full z-50 mt-2 origin-top rounded-2xl border border-tinted/20 bg-night-soft p-1.5 shadow-2xl transition-all duration-150 ease-out ${
          isOpen
            ? 'visible translate-y-0 scale-100 opacity-100'
            : 'invisible -translate-y-1 scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <UserAvatar src={userAvatarUrl} name={userName} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-paper">{userName}</p>
            <p className="truncate text-xs text-gray-mid">{userEmail}</p>
          </div>
        </div>

        <div className="my-1 border-t border-tinted/20" />

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsOpen(false);
            onOpenSettings();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-gray-mid transition-colors hover:bg-post-card hover:text-paper focus-visible:bg-post-card focus-visible:text-paper focus-visible:outline-none"
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={handleLogout}
          disabled={isSigningOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-gray-mid transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:bg-red-500/10 focus-visible:text-red-400 focus-visible:outline-none disabled:opacity-60"
        >
          <LogoutIcon className="h-4 w-4" />
          {isSigningOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </div>
  );
}
