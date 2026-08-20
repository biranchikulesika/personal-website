'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Identity, NavLink } from '@/lib/types';
import { useClickOutside } from './ui/use-click-outside';

interface NavbarProps {
  identity: Identity;
  links: NavLink[];
}

export function Navbar({ identity, links }: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useClickOutside(headerRef, closeMenu, menuOpen);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-tinted/20 bg-[#141413]/90 backdrop-blur-md"
      >
        <nav className="container-site flex items-center justify-between gap-x-6 py-3.5 md:py-4">
          <Link
            href="/"
            onClick={closeMenu}
            className={`text-lg font-semibold tracking-tight text-paper transition-colors hover:text-accent ${
              menuOpen ? 'invisible md:visible' : 'visible'
            }`}
            aria-label={identity.name}
          >
            {identity.name}
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-7 md:flex">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`text-sm transition-colors duration-200 ${
                      active
                        ? 'font-medium text-paper underline decoration-accent decoration-2 underline-offset-8'
                        : 'text-gray-mid hover:text-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="relative z-50 flex h-9 w-9 items-center justify-center rounded-full text-paper transition-colors hover:bg-night-soft md:hidden"
          >
            <div className="flex h-3.5 w-4.5 flex-col justify-between">
              <span
                className={`h-0.5 w-4.5 rounded-full bg-current transition-all duration-300 ${
                  menuOpen ? 'translate-y-[6px] rotate-45' : ''
                }`}
                aria-hidden
              />
              <span
                className={`h-0.5 w-4.5 rounded-full bg-current transition-all duration-200 ${
                  menuOpen ? 'scale-x-0 opacity-0' : 'opacity-100'
                }`}
                aria-hidden
              />
              <span
                className={`h-0.5 w-4.5 rounded-full bg-current transition-all duration-300 ${
                  menuOpen ? '-translate-y-[6px] -rotate-45' : ''
                }`}
                aria-hidden
              />
            </div>
          </button>
        </nav>

        {/* Mobile menu panel — floats above page content */}
        {menuOpen && (
          <div
            id="mobile-nav"
            className="absolute inset-x-0 top-full z-50 border-b border-tinted/20 bg-[#1c1c1a] px-6 py-4 shadow-2xl backdrop-blur-md md:hidden"
          >
            <ul className="flex flex-col space-y-1">
              {links.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={active ? 'page' : undefined}
                      className={`block py-2 text-base transition-colors ${
                        active
                          ? 'font-medium text-paper text-accent'
                          : 'text-gray-mid hover:text-accent'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>

      {/* Backdrop overlay */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          aria-hidden
        />
      )}
    </>
  );
}