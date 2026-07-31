import Link from 'next/link';
export const dynamic = 'force-static';
export const revalidate = 3600;
import { getOperatorFocuss, getPostsMeta } from '@/lib/queries';
import { getPersonaUrl } from '@/lib/utils';

export default async function OperatorPage() {
  // Server-side parallel data fetching
  const [fData, pData] = await Promise.all([
    getOperatorFocuss(),
    getPostsMeta(),
  ]);

  const focuses: any[] = fData
    ? fData.filter((f: any) => !f.hidden).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    : [];

  const notes: any[] = pData
    ? (() => {
        const operatorPosts = pData.filter(
          (p: any) => p.persona?.toLowerCase() === 'operator' && !p.hidden && p.status !== 'draft' && (!p.status || p.status.toLowerCase() !== 'draft')
        );
        operatorPosts.sort((a: any, b: any) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        });
        return operatorPosts.map((p: any) => ({
          id: p.slug || p.id,
          title: p.title,
          category: (p.tags && p.tags[0]) || 'Systems',
          date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
          content: p.excerpt || p.subtitle || 'System note.',
        }));
      })()
    : [];

  return (
    <div className="w-full min-h-screen font-mono overflow-x-hidden animate-fade-in">
      {/* SECTION 1 — HERO */}
      <section className="w-full min-h-svh flex flex-col justify-center pt-16 md:pt-20 pb-32 md:pb-40 relative">
        <div className="max-w-5xl mx-auto px-6 md:px-12 w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-0 lg:items-start">

            {/* HEADLINE */}
            <div className="lg:col-span-7 order-1 lg:row-start-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground leading-tight tracking-tight max-w-xl">
                Understanding systems through observation and failure.
              </h1>
            </div>

            {/* CURRENT FOCUS PANEL */}
            <div className="lg:col-span-4 lg:col-start-9 w-full order-2 lg:row-start-1 lg:row-span-2 lg:mt-2">
              <div className="border border-border p-5 md:p-6 bg-muted/20 rounded-[3px] space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-center text-[10px] text-primary/70 tracking-wide font-medium">
                  <span>Current focus</span>
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                </div>

                {focuses.length > 0 ? focuses.map((f: any) => (
                  <div key={f.id} className="border-t border-border pt-3">
                    <span className="text-[10px] text-primary/70 block mb-0.5 font-bold uppercase">[ {f.category || 'FOCUS'} ]</span>
                    <p className="text-xs text-foreground font-semibold leading-relaxed">{f.text}</p>
                  </div>
                )) : (
                  <div className="text-xs text-primary/70 p-2 italic pt-3 border-t border-border">
                    Current focus will appear here.
                  </div>
                )}
              </div>
            </div>

            {/* DESCRIPTION & LINKS */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6 lg:space-y-5 order-3 lg:row-start-2 lg:mt-5 pt-2 lg:pt-0">
              <p className="hidden md:block text-[13px] md:text-sm text-primary/80 leading-relaxed max-w-70 sm:max-w-md lg:max-w-lg">
                Studying how systems behave under pressure, how failures emerge, and how people adapt around them.
              </p>

              <div className="flex flex-wrap gap-6 pt-1 lg:pt-2">
                <a
                  href="#recent-observations"
                  className="text-xs font-mono tracking-wide text-primary/80 hover:text-foreground transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  View Field Notes <span className="opacity-50">↓</span>
                </a>
                <Link
                  href={getPersonaUrl('operator', '/blogs')}
                  className="text-xs font-mono tracking-wide text-primary/80 hover:text-foreground transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  View Archive <span className="opacity-50">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 w-full pb-36 md:pb-48">
        <main className="flex flex-col">
          {/* FIELD NOTES */}
          <section id="recent-observations" className="scroll-mt-24 w-full">
            <div className="mb-12 max-w-xl">
              <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-3">
                FIELD NOTES
              </h2>
              <p className="text-sm text-primary/80 leading-relaxed mb-4">
                Recent observations collected from ongoing study, experiments, failures, and system analysis.
              </p>
              <div className="text-[11px] font-mono text-primary/70 tracking-wide uppercase">
                Showing latest 3 observations
              </div>
            </div>

            <div className="flex flex-col max-w-2xl space-y-2">
              {notes.slice(0, 3).map((n: any, i: number) => {
                const isFirst = i === 0;
                return (
                  <Link
                    key={n.id}
                    href={`/p/${n.id}`}
                    className={`group flex flex-col ${isFirst ? 'pb-8 border-b' : 'py-6 border-b last:border-b-0'} border-border transition-opacity hover:opacity-100 opacity-90`}
                  >
                    {isFirst && <span className="text-[10px] font-mono text-primary uppercase tracking-widest mb-4 block font-bold">Latest Observation</span>}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] text-primary/90 font-bold tracking-widest uppercase">{n.category || 'Systems'}</span>
                      <span className="text-[10px] text-primary/40">&middot;</span>
                      <span className="text-[11px] text-primary/70 font-mono tracking-widest uppercase">{n.date || 'Unknown'}</span>
                    </div>
                    <h3 className={`${isFirst ? 'text-xl sm:text-[22px]' : 'text-[15px] sm:text-base'} font-bold text-foreground leading-snug group-hover:text-primary transition-colors mb-3 md:max-w-135`}>
                      {n.title}
                    </h3>
                    <p className={`${isFirst ? 'text-[15px] sm:text-base' : 'text-sm'} text-primary/80 leading-relaxed font-sans md:max-w-135`}>
                      {n.content}
                    </p>
                  </Link>
                );
              })}
              {notes.length === 0 && (
                <div className="text-[15px] text-primary/70 py-8 italic font-sans font-light">No observations published yet.</div>
              )}
            </div>

            <div className="pt-8 max-w-150">
              <Link href={getPersonaUrl('operator', '/blogs/archive')} className="text-xs font-mono tracking-wide text-primary/80 hover:text-foreground transition-colors duration-200 cursor-pointer flex items-center gap-1.5 focus:outline-none">
                View Observation Archive <span className="opacity-50">&rarr;</span>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
