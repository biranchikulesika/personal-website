'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface LogEntry {
  id: string;
  date: string;
  category?: string;
  source?: string;
  title: string;
  shortSummary?: string;
  longSummary?: string;
}

const getCategoryColor = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('typography') || cat.includes('design') || cat.includes('ui')) return 'text-purple-600 dark:text-purple-400 border-purple-500/20 bg-purple-500/10';
  if (cat.includes('database') || cat.includes('infra')) return 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10';
  if (cat.includes('api') || cat.includes('system') || cat.includes('backend')) return 'text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-500/10';
  if (cat.includes('content') || cat.includes('writing')) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
  return 'text-neutral-600 dark:text-neutral-400 border-neutral-500/20 bg-neutral-500/10';
};

export function BuildLogFeedItem({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasLongSummary = !!log.longSummary && log.longSummary.trim().length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 group">
      {/* Left: Category Tag */}
      <div className="md:w-32 shrink-0 pt-1">
        <span className={`inline-block text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border rounded-[3px] font-bold ${getCategoryColor(log.category || 'System')}`}>
          {log.category || 'System'}
        </span>
      </div>

      {/* Right: Content */}
      <div className="flex-1 pb-10 border-b border-border/50 group-last:border-0 relative">
        <div className="hidden md:block absolute -left-10 top-8 bottom-0 w-px bg-border/40 group-last:bg-transparent" />

        <div className="flex justify-between items-start gap-4 mb-2">
          <h4 className="text-lg text-foreground font-semibold leading-tight">{log.title}</h4>
          <span className="text-[10px] font-mono text-primary/60 shrink-0 mt-1">{log.date}</span>
        </div>

        <p className="text-[13px] md:text-sm text-primary/80 leading-relaxed mb-3">
          {log.shortSummary}
        </p>

        {hasLongSummary && (
          <div className="mt-2">
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div id={`log-details-${log.id}`} className="pt-2 pb-4 text-sm text-foreground/90 leading-relaxed border-l-2 border-primary/20 pl-4 mt-2 mb-2 font-serif">
                    {log.longSummary}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setExpanded(!expanded)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
              aria-expanded={expanded}
              aria-controls={`log-details-${log.id}`}
              className="text-[11px] font-mono text-primary/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors flex items-center gap-1.5 rounded"
            >
              {expanded ? '[-]' : '[+]'} {expanded ? 'Collapse details' : 'Read full log'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
