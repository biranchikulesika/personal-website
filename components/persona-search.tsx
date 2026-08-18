'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchPublishedPosts } from '@/app/actions/public.actions';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { formatDate } from '@/lib/utils';

type PersonaSearchProps = {
  persona?: string;
  mobileBgColor: string;
};

// ── Desktop Search Results Dropdown (with focus trap) ──────────────────────

function DesktopSearchResults({
  isOpen,
  query,
  results,
  isPending,
  isThinker,
  mobileBgColor,
  persona,
  onSelect,
  onClose,
}: {
  isOpen: boolean;
  query: string;
  results: any[];
  isPending: boolean;
  isThinker: boolean;
  mobileBgColor: string;
  persona?: string;
  onSelect: (slug: string) => void;
  onClose: () => void;
}) {
  const { containerRef: trapRef } = useFocusTrap<HTMLDivElement>({
    active: isOpen && query.length > 0 && results.length > 0,
    autoFocus: false,
    onEscape: onClose,
  });

  return (
    <AnimatePresence>
      {isOpen && query.length > 0 && (
        <motion.div
          ref={trapRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: isThinker || persona?.toLowerCase() === 'wanderer' ? 0.4 : 0.2, ease: 'easeOut' }}
          className={`absolute top-full right-0 mt-4 w-75 backdrop-blur-xl p-2 shadow-2xl flex flex-col gap-1 z-50 rounded-lg ${mobileBgColor} border border-border text-foreground max-h-[60vh] overflow-y-auto`}
          role="listbox"
          aria-label="Search results"
        >
          {results.length > 0 ? results.map((r, i) => (
            <div
              key={i}
              tabIndex={0}
              role="option"
              aria-selected={false}
              onClick={() => onSelect(r.slug)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(r.slug); } }}
              className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors overflow-hidden hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`}
            >
              <div className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis ${isThinker ? 'font-serif opacity-80' : persona?.toLowerCase() === 'wanderer' ? 'font-cormorant text-lg italic opacity-95' : 'opacity-90'}`}>{r.title}</div>
              <div className={`text-xs mt-1 text-primary/70`}>{formatDate(r.publishedAt || r.createdAt)}</div>
            </div>
          )) : !isPending ? (
            <div className="px-3 py-4 text-center text-sm text-primary/60 italic">No results found</div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Mobile Search Overlay (with focus trap) ────────────────────────────────

function MobileSearchOverlay({
  isOpen,
  query,
  results,
  isPending,
  isThinker,
  mobileBgColor,
  persona,
  onClose,
  onSelect,
  onQueryChange,
  placeholderText,
}: {
  isOpen: boolean;
  query: string;
  results: any[];
  isPending: boolean;
  isThinker: boolean;
  mobileBgColor: string;
  persona?: string;
  onClose: () => void;
  onSelect: (slug: string) => void;
  onQueryChange: (val: string) => void;
  placeholderText: string;
}) {
  const { containerRef: trapRef } = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    autoFocus: false,
    onEscape: onClose,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={trapRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: isThinker || persona?.toLowerCase() === 'wanderer' ? 0.4 : 0.2, ease: 'easeOut' }}
          className={`md:hidden absolute inset-0 z-50 flex flex-col px-4 pt-4 backdrop-blur-lg ${mobileBgColor}`}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="flex items-center">
            <Search className={`w-5 h-5 absolute left-6 ${isThinker || persona?.toLowerCase() === 'wanderer' ? 'opacity-30' : 'opacity-50'} pointer-events-none`} />
            <input
              type="text"
              autoFocus
              placeholder={placeholderText}
              aria-label={placeholderText}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className={`flex-1 bg-transparent border-none py-3 pl-10 pr-10 text-base outline-none w-full placeholder-primary/70 text-foreground italic`}
            />
            {isPending && query.length > 0 && (
              <Loader2 className="w-5 h-5 absolute right-16 opacity-50 animate-spin" />
            )}
            <button
              onClick={onClose}
              className={`p-2 ml-2 rounded-full transition-colors opacity-70 hover:opacity-100 hover:bg-muted`}
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {query.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex-1 shadow-2xl flex flex-col p-2 z-50 min-h-0 overflow-y-auto ${mobileBgColor}`}
            >
              {results.length > 0 ? results.map((r, i) => (
                <div
                  key={i}
                  tabIndex={0}
                  role="button"
                  onClick={() => onSelect(r.slug)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(r.slug); } }}
                  className={`px-4 py-4 rounded-md cursor-pointer transition-colors hover:bg-muted border-b border-border last:border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`}
                >
                  <div className={`text-sm leading-tight ${isThinker ? 'font-serif opacity-80' : persona?.toLowerCase() === 'wanderer' ? 'font-cormorant text-xl italic opacity-95' : 'font-medium opacity-90'}`}>{r.title}</div>
                  <div className={`text-xs mt-1.5 text-primary/70`}>{formatDate(r.publishedAt || r.createdAt)}</div>
                </div>
              )) : !isPending ? (
                <div className="px-4 py-8 text-center text-sm text-primary/60 italic">No results found</div>
              ) : null}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function PersonaSearch({ persona, mobileBgColor }: PersonaSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Debounced search
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      startTransition(async () => {
        const res = await searchPublishedPosts(debouncedQuery);
        setResults(res);
      });
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const placeholderMap: Record<string, string> = {
    main: 'Search posts...',
    builder: 'Search builds...',
    operator: 'Search signals...',
    thinker: 'Search reflections...',
    wanderer: 'Search stories...',
  };
  const placeholderText = placeholderMap[persona?.toLowerCase() || 'main'] || 'Search posts...';

  const isThinker = persona?.toLowerCase() === 'thinker';

  return (
    <div ref={containerRef} className="flex items-center">
      {/* Desktop Search Input */}
      <div className="hidden md:flex relative items-center">
        <Search className={`w-4 h-4 absolute left-3 ${isThinker ? 'opacity-30' : 'opacity-50'} pointer-events-none`} />
        <input
          type="text"
          placeholder={placeholderText}
          aria-label={placeholderText}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={`bg-transparent rounded-full py-1.5 pl-9 pr-4 text-sm w-48 focus:w-56 outline-none transition-all duration-500 border border-border focus:border-primary placeholder-primary/70 text-foreground italic opacity-95`}
        />
        {isPending && query.length > 0 && (
          <Loader2 className="w-4 h-4 absolute right-3 opacity-50 animate-spin" />
        )}
        <DesktopSearchResults
          isOpen={isOpen}
          query={query}
          results={results}
          isPending={isPending}
          isThinker={isThinker}
          mobileBgColor={mobileBgColor}
          persona={persona}
          onSelect={(slug) => { setIsOpen(false); router.push(`/p/${slug}`); }}
          onClose={() => setIsOpen(false)}
        />
      </div>

      {/* Mobile Search Button */}
      <button
        className="md:hidden p-2 rounded-full hover:bg-current/10 transition-colors opacity-70 hover:opacity-100 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        aria-label="Open search"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Mobile Overlay Search */}
      <MobileSearchOverlay
        isOpen={isOpen}
        query={query}
        results={results}
        isPending={isPending}
        isThinker={isThinker}
        mobileBgColor={mobileBgColor}
        persona={persona}
        onClose={() => { setIsOpen(false); setQuery(''); setResults([]); }}
        onSelect={(slug) => { setIsOpen(false); router.push(`/p/${slug}`); }}
        onQueryChange={setQuery}
        placeholderText={placeholderText}
      />
    </div>
  );
}
