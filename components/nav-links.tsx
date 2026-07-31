'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPersonaUrl } from '@/lib/utils';
import { createAuthClient } from '@/lib/supabase/auth-client';
import { useFocusTrap } from '@/hooks/use-focus-trap';

export function DesktopNav({ persona }: { persona?: 'main' | 'builder' | 'operator' | 'thinker' | 'wanderer' }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  let currentPersona: 'main' | 'builder' | 'operator' | 'thinker' | 'wanderer' = persona || 'main';
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createAuthClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  if (!persona) {
    if (pathname === '/builder' || pathname.startsWith('/builder/')) currentPersona = 'builder';
    else if (pathname === '/operator' || pathname.startsWith('/operator/')) currentPersona = 'operator';
    else if (pathname === '/thinker' || pathname.startsWith('/thinker/')) currentPersona = 'thinker';
    else if (pathname === '/wanderer' || pathname.startsWith('/wanderer/')) currentPersona = 'wanderer';
  }

  const aboutPath = getPersonaUrl(currentPersona, '/about');
  const blogPath = getPersonaUrl(currentPersona, '/blogs');

  const links = [
    { name: 'About', path: aboutPath },
    { name: 'Blogs', path: blogPath },
    { name: 'Newsletter', path: getPersonaUrl(currentPersona, '/newsletter') },
  ];

  return (
    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 mr-2 text-[11px] tracking-[0.2em] uppercase font-medium font-sans">
      {links.map(link => (
        <Link key={link.name} href={link.path} prefetch={true} className="opacity-60 hover:opacity-100 transition-opacity">
          {link.name}
        </Link>
      ))}
      {isAuthenticated ? (          <Link href="/admin" prefetch={true} className="opacity-80 hover:opacity-100 transition-all border border-current/30 px-4 py-1.5 hover:bg-current/5">
            Admin
          </Link>
        ) : (
          <Link href={getPersonaUrl('main', '/fund')} prefetch={true} className="opacity-80 hover:opacity-100 transition-all border border-current/30 px-4 py-1.5 hover:bg-current/5">
            Fund
          </Link>
      )}
    </nav>
  );
}

export function MobileNav({ mobileBgColor, persona }: { mobileBgColor: string, persona?: 'main' | 'builder' | 'operator' | 'thinker' | 'wanderer' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  let currentPersona: 'main' | 'builder' | 'operator' | 'thinker' | 'wanderer' = persona || 'main';
  
  if (!persona) {
    if (pathname === '/builder' || pathname.startsWith('/builder/')) currentPersona = 'builder';
    else if (pathname === '/operator' || pathname.startsWith('/operator/')) currentPersona = 'operator';
    else if (pathname === '/thinker' || pathname.startsWith('/thinker/')) currentPersona = 'thinker';
    else if (pathname === '/wanderer' || pathname.startsWith('/wanderer/')) currentPersona = 'wanderer';
  }

  const aboutPath = getPersonaUrl(currentPersona, '/about');
  const blogPath = getPersonaUrl(currentPersona, '/blogs');

  const links = [
    { name: 'About', path: aboutPath },
    { name: 'Blogs', path: blogPath },
    { name: 'Newsletter', path: getPersonaUrl(currentPersona, '/newsletter') },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createAuthClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isThinker = currentPersona === 'thinker';
  const isWanderer = currentPersona === 'wanderer';

  // Focus trap for the mobile nav menu when open
  const { containerRef: menuTrapRef } = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: () => setIsOpen(false),
  });

  return (
    <div ref={containerRef} className="md:hidden relative flex items-center font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 transition-colors rounded-full flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-muted`}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuTrapRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: isThinker || isWanderer ? 0.4 : 0.2, ease: "easeOut" }}
            className={`absolute top-full right-0 mt-4 w-48 backdrop-blur-xl p-2 flex flex-col gap-1 z-50 rounded-lg ${mobileBgColor} border border-border shadow-2xl text-foreground`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {links.map(link => (
              <Link
                key={link.name}
                href={link.path}
                prefetch={true}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 text-[10px] tracking-[0.2em] uppercase transition-colors rounded-md opacity-70 hover:opacity-100 hover:bg-muted font-light`}
              >
                {link.name}
              </Link>
            ))}
            <div className={`my-1 border-t border-border`}></div>
            {isAuthenticated ? (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={`mx-2 my-2 px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors text-center rounded opacity-80 hover:opacity-100 border border-border hover:bg-muted font-light`}
              >
                Admin
              </Link>
            ) : (
              <Link
                href={getPersonaUrl('main', '/fund')}
                onClick={() => setIsOpen(false)}
                className={`mx-2 my-2 px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors text-center rounded opacity-80 hover:opacity-100 border border-border hover:bg-muted font-light`}
              >
                Fund
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
