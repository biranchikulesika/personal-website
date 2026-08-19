'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Identity, NavLink } from '@/lib/types';

interface NavbarProps {
  identity: Identity;
  links: NavLink[];
}

export function Navbar({ identity, links }: NavbarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-sm">
      <nav className="container-site flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-ink"
          aria-label={identity.name}
        >
          {identity.name}
        </Link>

        <ul className="flex flex-wrap items-center gap-6 md:gap-7">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-sm transition-colors ${
                    active
                      ? 'font-medium text-ink'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}