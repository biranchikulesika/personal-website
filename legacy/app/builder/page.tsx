import Link from 'next/link';
export const dynamic = 'force-static';
export const revalidate = 3600;
import {
  getBuilderStatuses,
  getActiveSystems,
  getBuildLogs,
  getPostsMeta,
} from '@/lib/queries';
import { BuildLogFeedItem } from '@/components/builder/build-log-item';
import { ScrollToSectionButton } from '@/components/builder/scroll-to-section';
import { formatDate } from '@/lib/utils';

// --- TYPE DEFINITIONS ---
export type SystemStatus = 'stable' | 'active' | 'lab';

export interface SystemItem {
  id: string;
  code?: string;
  title?: string;
  name?: string;
  status: SystemStatus | string;
  description: string;
  tags?: string[];
  stack?: string[];
  updated?: string;
  updatedAt?: string;
  featured?: boolean;
  url?: string;
}

// --- SECTION PACING SEPARATORS ---
function OperationalDivider({ label, phrases }: { label: string; phrases: string[] }) {
  return (
    <div className="w-full pt-8 pb-4 select-none font-mono">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="w-full h-px bg-neutral-200/15 dark:bg-neutral-900/25 mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] md:text-[11px] uppercase tracking-[0.25em] py-1 dark:text-neutral-500 text-muted-text/95">
          <span className="font-semibold">{label}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium opacity-80">
            {phrases.map((phrase, index) => (
              <span key={index} className="flex items-center gap-2">
                <span>{phrase}</span>
                {index < phrases.length - 1 && <span className="opacity-25 select-none">&bull;</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CenteredStatement({ text }: { text: string }) {
  return (
    <div className="w-full my-6 py-1 select-none font-mono">
      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center font-medium">
        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.35em] text-neutral-450 dark:text-neutral-500/80 font-semibold">
          [ {text} ]
        </span>
      </div>
    </div>
  );
}

// --- STATUS BADGE ---
const renderStatusBadge = (status: SystemStatus | string) => {
  const normStatus = (status || 'active').toLowerCase() as SystemStatus;
  switch (normStatus) {
    case 'stable':
      return (
        <span className="text-[9px] text-accent-text tracking-[0.2em] border border-emerald-500/15 dark:bg-emerald-950/15 bg-emerald-50 px-2 py-0.5 rounded-xs font-bold uppercase">
          STABLE
        </span>
      );
    case 'active':
      return (
        <span className="text-[9px] text-muted-text tracking-[0.2em] border border-neutral-500/15 dark:bg-neutral-800/50 bg-neutral-100 px-2 py-0.5 rounded-xs font-bold uppercase">
          ACTIVE
        </span>
      );
    case 'lab':
      return (
        <span className="text-[9px] dark:text-amber-500 text-amber-600 tracking-[0.2em] border border-dashed border-amber-500/20 dark:bg-amber-950/15 bg-amber-50 px-2 py-0.5 rounded-xs font-bold uppercase">
          LAB
        </span>
      );
    default:
      return (
        <span className="text-[9px] text-muted-text tracking-[0.2em] border border-neutral-500/15 dark:bg-neutral-800/50 bg-neutral-100 px-2 py-0.5 rounded-xs font-bold uppercase">
          {normStatus}
        </span>
      );
  }
};

// --- SYSTEM CARDS ---
const SystemShowcase = ({ system }: { system: SystemItem }) => {
  const isDashed = system.status === 'lab';
  const borderClass = isDashed ? 'border border-dashed border-border' : 'border border-border';

  return (
    <div className={`lg:col-span-7 flex flex-col justify-between p-4 md:p-5 dark:bg-neutral-900/5 bg-surface ${borderClass} hover:border-border dark:hover:border-neutral-700 hover:bg-muted dark:hover:bg-neutral-900/10 hover:-translate-y-px transition-all duration-200 ease-out rounded-[3px] shadow-sm group`}>
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-lg font-bold text-heading transition-colors leading-tight">
            {system.url ? (
              <Link href={system.url} className="hover:underline">{system.title || system.name}</Link>
            ) : system.name}
          </h3>
          <div className="shrink-0 mt-0.5">{renderStatusBadge(system.status)}</div>
        </div>
        <p className="text-[13px] text-body leading-relaxed max-w-xl">{system.description}</p>
      </div>
      <div className="mt-4 flex justify-between items-center text-[10px] text-muted-text pt-2">
        <span className="truncate">{(system.stack || system.tags || []).join(' • ')}</span>
        <span className="font-mono text-[9px] opacity-75">Updated {system.updatedAt || system.updated || 'recently'}</span>
      </div>
    </div>
  );
};

const SystemCard = ({ system }: { system: SystemItem }) => {
  const isDashed = system.status === 'lab';
  const borderClass = isDashed ? 'border border-dashed border-border' : 'border border-border';

  return (
    <div className={`lg:col-span-5 flex flex-col justify-between p-4 md:p-5 dark:bg-neutral-900/5 bg-surface ${borderClass} hover:border-border dark:hover:border-neutral-700 hover:bg-muted dark:hover:bg-neutral-900/10 hover:-translate-y-px transition-all duration-200 ease-out rounded-[3px] shadow-sm group`}>
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-[17px] font-bold text-heading transition-colors leading-tight">
            {system.url ? (
              <Link href={system.url} className="hover:underline">{system.title || system.name}</Link>
            ) : system.name}
          </h3>
          <div className="shrink-0 mt-0.5">{renderStatusBadge(system.status)}</div>
        </div>
        <p className="text-[13px] text-body leading-relaxed">{system.description}</p>
      </div>
      <div className="mt-4 flex flex-col gap-1 text-[10px] text-muted-text pt-2">
        <span className="truncate">{(system.stack || system.tags || []).join(' • ')}</span>
        <span className="font-mono text-[9px] opacity-60">Updated {system.updatedAt || system.updated || 'recently'}</span>
      </div>
    </div>
  );
};

// --- PAGE ---
export default async function BuilderPage() {
  // All data fetched on the server — parallel, no client-side waterfalls
  const [statusData, systemsDataResponse, logsData, allPosts] = await Promise.all([
    getBuilderStatuses(),
    getActiveSystems(),
    getBuildLogs(),
    getPostsMeta(),
  ]);

  // Process data server-side
  const operationalStateEntries = statusData && statusData.length > 0
    ? (() => {
        const s = statusData[0];
        return [
          { label: 'status', primaryValue: s.statusText || 'Operational' },
          { label: 'focus', primaryValue: s.currentFocus || 'Development' },
          { label: 'last update', primaryValue: s.updatedAt || 'Recently' },
        ];
      })()
    : [];

  const systemsData = systemsDataResponse
    ? systemsDataResponse.filter((s: any) => s.hidden !== true).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    : [];

  const buildLogsData = logsData
    ? logsData.map((l: any, i: number) => ({
        ...l,
        category: l.category || l.title || 'System',
        shortSummary: l.shortSummary || l.description || '',
        longSummary: l.longSummary || '',
        id: l.id || `log-${i}`,
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
    : [];

  const posts = allPosts
    ? allPosts
        .filter((p: any) => p.persona?.toLowerCase() === 'builder' && p.hidden !== true && p.status !== 'draft' && (!p.status || p.status.toLowerCase() !== 'draft'))
        .sort((a: any, b: any) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        })
    : [];

  const featuredPost = posts.find((p: any) => p.featured) || posts[0];
  let remainingPosts = posts.filter((p: any) => p.id !== featuredPost?.id);
  const secondaryPost = remainingPosts[0];
  remainingPosts = remainingPosts.slice(1, 6);

  return (
    <div className="w-full font-mono bg-transparent animate-fade-in">
      {/* SECTION 1 — HERO */}
      <section className="w-full min-h-svh flex flex-col justify-center pt-16 md:pt-20 pb-32 md:pb-40 relative">
        <div className="max-w-5xl mx-auto px-6 md:px-12 w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-0 lg:items-start">
            {/* HEADLINE */}
            <div className="lg:col-span-7 order-1 lg:row-start-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-heading leading-tight tracking-tight max-w-xl">
                Building systems carefully over time.
              </h1>
            </div>

            {/* OPERATIONAL STATE PANEL */}
            <div className="lg:col-span-4 lg:col-start-9 w-full order-2 lg:row-start-1 lg:row-span-2 lg:mt-2">
              <div className="border border-border p-5 md:p-6 dark:bg-neutral-900/5 bg-surface shadow-sm rounded-[3px] space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-center text-[10px] text-muted-text tracking-wide font-medium">
                  <span>Operational state</span>
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-text opacity-40" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-text" />
                  </span>
                </div>

                {operationalStateEntries.map((entry, index) => (
                  <div key={index} className="border-t border-[#E7E4DD]/70 dark:border-neutral-900/30 pt-3">
                    <span className="text-[10px] text-muted-text block mb-0.5 font-bold">[ {entry.label} ]</span>
                    <p className="text-xs text-heading font-semibold leading-relaxed">{entry.primaryValue}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DESCRIPTION & LINKS */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6 lg:space-y-5 order-3 lg:row-start-2 lg:mt-5 pt-2 lg:pt-0">
              <p className="hidden md:block text-[13px] md:text-sm text-primary/80 leading-relaxed max-w-70 sm:max-w-md lg:max-w-lg">
                I build tools, systems, experiments, workflows, and digital environments focused on clarity, structure, and long-term usefulness.
              </p>

              <div className="flex flex-wrap gap-6 pt-1 lg:pt-2">
                <ScrollToSectionButton
                  targetId="active-systems"
                  className="text-xs font-mono tracking-wide text-primary/70 hover:text-foreground transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  Explore Systems <span className="opacity-50">↓</span>
                </ScrollToSectionButton>
                <ScrollToSectionButton
                  targetId="build-logs"
                  className="text-xs font-mono tracking-wide text-primary/70 hover:text-foreground transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  View Build Logs <span className="opacity-50">↓</span>
                </ScrollToSectionButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — ACTIVE SYSTEMS */}
      <section id="active-systems" className="w-full min-h-svh flex flex-col justify-center py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12 w-full">
          <div className="mb-4 pb-2 border-b border-border">
            <h2 className="text-[11px] text-primary/70 uppercase tracking-[0.25em] font-bold">
              [ ACTIVE SYSTEMS ]
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {systemsData.length === 0 ? (
              <div className="lg:col-span-12 py-12 text-center text-primary/70 font-sans font-light italic border border-dashed border-border rounded-sm">
                Systems are being assembled.
              </div>
            ) : systemsData.map((sys: any) => sys.featured ? (
              <SystemShowcase key={sys.id} system={sys} />
            ) : (
              <SystemCard key={sys.id} system={sys} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — BUILD LOGS */}
      <section id="build-logs" className="w-full min-h-svh flex flex-col justify-center py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-10 w-full">
          <div className="mb-10 pb-1.5 border-b border-border flex justify-between items-end">
            <h2 className="text-[11px] text-primary/70 uppercase tracking-[0.25em] font-bold">
              [ BUILD LOGS ]
            </h2>
            <span className="text-[9px] text-primary/50 font-mono">CHRONOLOGICAL</span>
          </div>

          <div className="relative max-h-200 overflow-y-auto scrollbar-hide pr-2">
            {buildLogsData.length === 0 ? (
              <div className="flex items-center justify-center py-20 border border-dashed border-border rounded-sm">
                <span className="text-primary/70 font-sans font-light italic text-sm">No build logs recorded yet.</span>
              </div>
            ) : (
              <div className="flex flex-col">
                {buildLogsData.map((log: any) => (
                  <BuildLogFeedItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4 — FROM FORGE */}
      {posts.length > 0 && (
        <section id="from-forge" className="w-full justify-center py-16 flex flex-col min-h-svh">
          <div className="max-w-4xl mx-auto px-6 md:px-10 w-full">
            <div className="mb-4 pb-1.5 border-b border-border">
              <h2 className="text-[11px] text-primary/70 uppercase tracking-[0.25em] font-bold">
                [ FROM FORGE ]
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* FEATURED ESSAYS */}
              <div className="lg:col-span-7 space-y-6">
                {featuredPost && (
                  <Link href={`/p/${featuredPost.slug || featuredPost.id}`} className="space-y-3 block group">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground group-hover:underline leading-tight mb-2">
                      {featuredPost.title}
                    </h3>
                    <span className="text-[11px] font-mono text-primary/70 block group-hover:text-primary transition-colors">
                      {formatDate(featuredPost.publishedAt) || 'Unknown'}
                    </span>
                    <p className="text-sm text-primary/90 leading-relaxed max-w-xl group-hover:text-primary transition-colors">
                      {featuredPost.excerpt || 'Read reflection.'}
                    </p>
                  </Link>
                )}

                {featuredPost && secondaryPost && <div className="w-full h-px bg-border" />}

                {secondaryPost && (
                  <Link href={`/p/${secondaryPost.slug || secondaryPost.id}`} className="space-y-2 opacity-95 block group">
                    <h4 className="text-base md:text-lg font-semibold text-foreground group-hover:underline leading-snug">
                      {secondaryPost.title}
                    </h4>
                    <span className="text-[10px] font-mono text-primary/70 block group-hover:text-primary transition-colors">
                      {formatDate(secondaryPost.publishedAt) || 'Unknown'}
                    </span>
                    <p className="text-xs text-primary/90 leading-relaxed max-w-lg group-hover:text-primary transition-colors">
                      {secondaryPost.excerpt || 'Read reflection.'}
                    </p>
                  </Link>
                )}
              </div>

              {/* RECENT REFLECTIONS */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.2em] block">
                    recent reflections
                  </span>
                  <div className="divide-y border-t border-border divide-border border-b">
                    {remainingPosts.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/p/${p.slug || p.id}`}
                        className="group block py-2.5 hover:bg-muted/10 transition-colors duration-150 px-2 -mx-2"
                      >
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-foreground transition-colors">
                          {p.title}
                        </h4>
                        <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-primary/70">
                          <span>{(p.tags && p.tags[0]) || 'Reflection'}</span>
                          <span>{formatDate(p.publishedAt) || 'Unknown'}</span>
                        </div>
                      </Link>
                    ))}
                    {remainingPosts.length === 0 && (
                      <div className="py-2.5 px-2 -mx-2 text-xs text-primary/70 font-mono">No more posts.</div>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <ScrollToSectionButton
                    targetId="build-logs"
                    className="text-xs text-primary/80 hover:text-foreground transition-all duration-200 hover:underline flex items-center gap-1 cursor-pointer font-bold font-mono"
                  >
                    View Writing Timeline <span className="opacity-70">→</span>
                  </ScrollToSectionButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SYSTEM ARCHITECTURE */}
      <section className="w-full flex flex-col justify-start pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-6 md:px-10 w-full overflow-hidden md:overflow-visible">
          <div className="mb-8 pb-1.5 border-b border-border flex justify-between items-end">
            <h2 className="text-[11px] text-primary/70 uppercase tracking-[0.25em] font-bold">
              [ SYSTEM ARCHITECTURE ]
            </h2>
            <span className="md:hidden text-[9px] text-primary/70 font-mono tracking-widest uppercase mb-0.5">
              Swipe <span className="opacity-70">→</span>
            </span>
          </div>

          <div className="flex overflow-x-auto gap-x-12 md:gap-x-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none md:overflow-visible md:grid md:grid-cols-1 md:gap-y-10 pb-4 md:pb-0">
            <div className="w-full shrink-0 snap-start grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {[
                { title: 'KNOWLEDGE LAYER', sub: 'Notes • References • Archives' },
                { title: 'PROJECT LAYER', sub: 'Experiments • Systems • Workspaces' },
                { title: 'PUBLISHING LAYER', sub: 'Essays • Logs • Newsletters' },
              ].map(c => (
                <div key={c.title} className="border-l-2 border-border pl-4 py-0.5">
                  <p className="text-sm text-foreground font-semibold tracking-wide">{c.title}</p>
                  <span className="text-[11px] text-primary/70 block mt-1.5 font-normal">{c.sub}</span>
                </div>
              ))}
            </div>

            <div className="w-full shrink-0 snap-start grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {[
                { title: 'DEPLOYMENT LAYER', sub: 'Preview • Production • Delivery' },
                { title: 'REVISION LAYER', sub: 'History • Versions • Records' },
                { title: 'ARCHIVE LAYER', sub: 'Snapshots • Memory • Preservation' },
              ].map(c => (
                <div key={c.title} className="border-l-2 border-border pl-4 py-0.5">
                  <p className="text-sm text-foreground font-semibold tracking-wide">{c.title}</p>
                  <span className="text-[11px] text-primary/70 block mt-1.5 font-normal">{c.sub}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-border text-center max-w-sm mx-auto">
            <p className="text-xs text-primary/70 italic tracking-wide leading-relaxed">
              &quot;Most systems fail because they grow faster than they are understood.&quot;
            </p>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-linear-to-r from-transparent via-neutral-200/50 dark:via-neutral-900/20 to-transparent my-4" />
    </div>
  );
}
