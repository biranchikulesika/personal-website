'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { getPersonaUrl } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { ChevronDown } from 'lucide-react';

const PERSONAS = [
  { name: 'Builder', path: getPersonaUrl('builder'), color: 'text-foreground', font: 'font-mono', highlight: 'bg-neutral-400 shadow-[0_0_10px_rgba(163,163,163,0.5)]' },
  { name: 'Operator', path: getPersonaUrl('operator'), color: 'text-emerald-500', font: 'font-mono', highlight: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
  { name: 'Wanderer', path: getPersonaUrl('wanderer'), color: 'text-orange-500', font: 'font-serif', highlight: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' },
  { name: 'Thinker', path: getPersonaUrl('thinker'), color: 'text-gray-400', font: 'font-sans', highlight: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' },
];

export function PersonaSwitcher({ currentPersona, currentStyle }: { currentPersona: string, currentStyle: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activePersona = PERSONAS.find(p => p.name === currentPersona);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center z-50">
      <Link href={getPersonaUrl('main')} prefetch={true} className="hover:opacity-70 transition-opacity">
        <Logo />
      </Link>

      <div className="mx-2 flex items-center justify-center">
        <span className={`w-1.5 h-1.5 rotate-45 ${activePersona?.highlight || 'bg-current'} opacity-90 transition-all duration-500`}></span>
      </div>

      <div className="relative flex items-center gap-1.5" ref={menuRef}>
        <Link
          href={activePersona?.path || '#'}
          className={`uppercase tracking-widest text-sm flex items-center ${currentStyle} transition-opacity hover:opacity-75`}
        >
          {currentPersona}
        </Link>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm flex items-center justify-center opacity-70 hover:opacity-100"
          aria-label="Switch Persona"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 mt-4 bg-background backdrop-blur-xl border border-border rounded-lg p-2 shadow-2xl min-w-45 flex flex-col gap-1 overflow-hidden"
            >
              {PERSONAS.filter(p => p.name !== currentPersona).map(p => (
                <Link
                  key={p.name}
                  href={p.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-sm transition-all rounded-md flex items-center gap-2 ${p.font} ${p.color} hover:bg-muted`}
                >
                  <span className="uppercase tracking-wider">{p.name}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
