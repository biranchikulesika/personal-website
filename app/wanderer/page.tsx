import Link from 'next/link';
export const dynamic = 'force-static';
export const revalidate = 3600;
import Image from 'next/image';
import { getFragments, getPostsMeta } from '@/lib/queries';
import { getPersonaUrl } from '@/lib/utils';
import { FragmentCycler } from '@/components/wanderer/fragment-cycler';
import { LettersForm, LettersFormMobile } from '@/components/wanderer/letters-form';

export default async function WandererPage() {
  // Server-side data fetching — removed dead getJournalMoments() call
  const [fData, pData] = await Promise.all([
    getFragments(),
    getPostsMeta(),
  ]);

  const fragmentsData: string[] = fData && fData.length > 0
    ? fData.filter((f: any) => !f.hidden).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((f: any) => f.text || f.content)
    : [];

  const allPosts: any[] = pData
    ? pData.filter((p: any) => !p.hidden && p.status !== 'draft' && (!p.status || p.status.toLowerCase() !== 'draft') && p.persona?.toLowerCase() === 'wanderer')
        .sort((a: any, b: any) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        })
    : [];

  const latestPosts = allPosts.slice(0, 3).map((p: any) => ({
    slug: p.slug || p.id,
    date: p.publishedAt || 'Unknown',
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    title: p.title,
    excerpt: p.excerpt || 'Quiet reflection.',
    thumbnailUrl: p.coverImageUrl || p.coverImage || null,
    thumbnailAlt: p.title || 'Thumbnail',
  }));

  const archiveEntries = allPosts.slice(3).map((p: any) => ({
    title: p.title,
    date: p.publishedAt || 'Unknown',
    slug: p.slug || p.id,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-14 py-12 lg:py-24 relative font-spectral animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

        {/* LEFT SIDE: MAIN READING FLOW */}
        <div className="lg:col-span-8 space-y-20 lg:space-y-32">

          {/* HERO SECTION */}
          <header className="max-w-2xl select-none">
            <span id="hero-eyebrow" className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-accent-text block mb-4 md:mb-5 opacity-80">
              VOLUME IV • WANDERER
            </span>
            <h1 id="hero-heading" className="text-4xl sm:text-4.5xl md:text-5xl italic text-heading font-cormorant tracking-tight leading-tight mb-5">
              Wanderer
            </h1>
            <p id="hero-description" className="text-body/90 leading-[1.85] text-[15.5px] sm:text-[16.5px] font-light italic mb-8 max-w-xl">
              I write about the places I pass through, the thoughts I cannot carry forever, and the quiet moments that stay with me longer than expected.
            </p>

            <div id="currently-status-box" className="flex items-start gap-4 border-l border-[#9d613c]/20 dark:border-[#B97A56]/20 pl-4 py-1 select-none max-w-lg">
              <div className="flex flex-col">
                <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-accent-text/70 mb-1 font-medium">
                  CURRENTLY:
                </span>
                <span className="font-spectral text-[13.5px] text-muted-text italic leading-relaxed">
                  I have been trying to sit with silence instead of escaping into distractions.
                </span>
              </div>
            </div>
          </header>

          {/* LATEST REFLECTIONS */}
          <section id="latest-reflections" className="space-y-16 lg:space-y-20">
            <div className="border-b border-border-subtle dark:border-border-subtle/15 pb-1.5 select-none">
              <h2 className="font-sans text-[9.5px] uppercase text-accent-text/85 font-medium tracking-widest block">
                LATEST REFLECTIONS
              </h2>
            </div>

            <div className="space-y-16 lg:space-y-32">
              {latestPosts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
                  <p className="font-spectral text-lg italic text-body">No stories have been shared yet.</p>
                </div>
              ) : latestPosts.map((post, index) => (
                <article key={post.slug} className={`group ${index === 0 ? 'mb-16 lg:mb-28' : index === 1 ? 'mb-20 lg:mb-32' : 'mb-0'}`}>
                  {/* Mobile view */}
                  <div className="block lg:hidden space-y-4">
                    <div className="relative aspect-3/2 w-full overflow-hidden bg-surface border border-border rounded-[1px] shadow-sm">
                      {post.thumbnailUrl ? (
                        <Image
                          src={post.thumbnailUrl}
                          alt={post.thumbnailAlt}
                          fill
                          sizes="(max-width: 768px) 100vw, 800px"
                          referrerPolicy="no-referrer"
                          className="object-cover w-full h-full filter grayscale-22 contrast-88 sepia-12 saturate-75 brightness-92 dark:brightness-76"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-tr from-[#EAE3D5] to-[#D5CDBD] dark:from-[#15110E] dark:to-[#221C16]" />
                      )}
                    </div>
                    <Link href={`/p/${post.slug}`}>
                      <h3 className="font-cormorant italic text-xl font-normal leading-tight text-heading active:text-accent-text mb-2 pt-1 transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="font-spectral font-light text-[14.5px] leading-relaxed text-body/90 italic">
                      {post.excerpt}
                    </p>
                    <div className="text-[9.5px] font-mono tracking-normal text-body/60 uppercase pt-1">
                      {post.publishedAt || post.createdAt}
                    </div>
                  </div>

                  {/* Desktop view */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-0 items-center">
                    {index === 0 && (
                      <>
                        <div className="lg:col-span-5 pr-10">
                          <div className="relative aspect-3/2 w-full overflow-hidden bg-surface border border-border rounded-[1px] shadow-sm my-2">
                            {post.thumbnailUrl ? (
                              <Image src={post.thumbnailUrl} alt={post.thumbnailAlt} fill sizes="320px" referrerPolicy="no-referrer" className="object-cover w-full h-full filter grayscale-22 contrast-88 sepia-12 saturate-75 brightness-92 dark:brightness-76 group-hover:grayscale-8 group-hover:brightness-94 dark:group-hover:brightness-84 transition-all duration-700 ease-in-out" />
                            ) : (
                              <div className="w-full h-full bg-linear-to-tr from-[#EAE3D5] to-[#D5CDBD] dark:from-[#15110E] dark:to-[#221C16]" />
                            )}
                          </div>
                        </div>
                        <div className="lg:col-span-7 flex flex-col justify-center">
                          <div className="text-[9.5px] font-mono tracking-normal text-body/60 mb-2.5">{post.publishedAt || post.createdAt}</div>
                          <Link href={`/p/${post.slug}`}>
                            <h3 className="font-cormorant italic text-[22.5px] font-normal leading-tight text-heading hover:text-accent-text duration-500 transition-colors mb-3.5">{post.title}</h3>
                          </Link>
                          <p className="font-spectral font-light text-[15px] leading-[1.85] text-body/90 italic max-w-lg">{post.excerpt}</p>
                        </div>
                      </>
                    )}

                    {index === 1 && (
                      <>
                        <div className="lg:col-span-7 flex flex-col justify-center pr-6">
                          <div className="text-[9.5px] font-mono tracking-normal text-body/60 mb-2.5">{post.publishedAt || post.createdAt}</div>
                          <Link href={`/p/${post.slug}`}>
                            <h3 className="font-cormorant italic text-[22.5px] font-normal leading-tight text-heading hover:text-accent-text duration-500 transition-colors mb-3.5">{post.title}</h3>
                          </Link>
                          <p className="font-spectral font-light text-[15px] leading-[1.85] text-body/90 italic max-w-xl">{post.excerpt}</p>
                        </div>
                        <div className="lg:col-span-1" />
                        <div className="lg:col-span-4">
                          <div className="relative aspect-4/3 w-full overflow-hidden bg-surface border border-border rounded-[1px] my-1 opacity-90 shadow-sm">
                            {post.thumbnailUrl ? (
                              <Image src={post.thumbnailUrl} alt={post.thumbnailAlt} fill sizes="260px" referrerPolicy="no-referrer" className="object-cover w-full h-full filter grayscale-25 contrast-86 sepia-14 saturate-70 brightness-90 dark:brightness-74 group-hover:grayscale-5 group-hover:brightness-93 dark:group-hover:brightness-81 transition-all duration-700 ease-in-out" />
                            ) : (
                              <div className="w-full h-full bg-linear-to-tr from-[#EAE3D5] to-[#D5CDBD] dark:from-[#15110E] dark:to-[#221C16]" />
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {index === 2 && (
                      <>
                        <div className="lg:col-span-4">
                          <div className="relative aspect-16/10 w-full overflow-hidden bg-surface border border-border rounded-[1px] shadow-sm my-2">
                            {post.thumbnailUrl ? (
                              <Image src={post.thumbnailUrl} alt={post.thumbnailAlt} fill sizes="320px" referrerPolicy="no-referrer" className="object-cover w-full h-full filter grayscale-22 contrast-88 sepia-12 saturate-75 brightness-92 dark:brightness-76 group-hover:grayscale-8 group-hover:brightness-94 dark:group-hover:brightness-84 transition-all duration-700 ease-in-out" />
                            ) : (
                              <div className="w-full h-full bg-linear-to-tr from-[#EAE3D5] to-[#D5CDBD] dark:from-[#15110E] dark:to-[#221C16]" />
                            )}
                          </div>
                        </div>
                        <div className="lg:col-span-1" />
                        <div className="lg:col-span-7 flex flex-col justify-center">
                          <div className="text-[9.5px] font-mono tracking-normal text-body/60 mb-2.5">{post.publishedAt || post.createdAt}</div>
                          <Link href={`/p/${post.slug}`}>
                            <h3 className="font-cormorant italic text-[22.5px] font-normal leading-tight text-heading hover:text-accent-text duration-500 transition-colors mb-3.5">{post.title}</h3>
                          </Link>
                          <p className="font-spectral font-light text-[15px] leading-[1.85] text-body/90 italic max-w-xl">{post.excerpt}</p>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* FRAGMENT SECTION — Client component for cycling */}
          <FragmentCycler fragments={fragmentsData} />

          {/* MOBILE LETTERS SIGNUP */}
          <section id="mobile-letters-signup" className="block lg:hidden py-10 border-t border-border-subtle dark:border-border-subtle/15 select-none">
            <span className="text-[10px] font-sans tracking-[0.2em] text-accent-text/80 uppercase font-medium block mb-4">
              LETTERS
            </span>
            <p className="font-spectral font-light text-[14px] leading-relaxed text-body/90 italic mb-6">
              Sometimes I send quiet letters about memories, places, unfinished thoughts, and the things I notice when life slows down.
            </p>
            <LettersFormMobile />
            <p className="text-[10.5px] text-body/70 font-mono tracking-wider mt-4">
              No noise. Just occasional reflections.
            </p>
          </section>

          {/* OLDER REFLECTIONS & ARCHIVE */}
          <section id="older-reflections-archive" className="space-y-12 pb-12 border-t border-border-subtle dark:border-border-subtle/15 pt-16">
            <div className="border-b border-border-subtle dark:border-border-subtle/15 pb-1.5 select-none">
              <h2 className="font-sans text-[9.5px] uppercase text-accent-text/85 font-medium tracking-widest block">
                OLDER REFLECTIONS &amp; ARCHIVE
              </h2>
            </div>

            <div className="relative pl-4 sm:pl-5 ml-0 mt-8">
              <div className="absolute left-0 top-1.5 bottom-0 w-px bg-linear-to-b from-[#9d613c]/25 via-[#9d613c]/12 to-transparent dark:from-[#B97A56]/25 dark:via-[#B97A56]/12 dark:to-transparent" />

              <div className="space-y-12 md:space-y-14">
                {archiveEntries.length === 0 ? (
                  <div className="py-10 text-body/60 font-spectral italic opacity-60">
                    No older reflections yet.
                  </div>
                ) : archiveEntries.map((entry, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute left-[-18.2px] sm:left-[-22.2px] top-1.75 w-1 h-1 rounded-full bg-[#9d613c]/40 dark:bg-[#B97A56]/40 transition-colors duration-300" />
                    <div className="text-[9px] font-mono tracking-normal text-body/60 uppercase select-none mb-2">
                      {entry.date}
                    </div>
                    <Link
                      href={entry.slug !== '#' ? `/p/${entry.slug}` : '#'}
                      className="font-cormorant italic text-[17.5px] md:text-[18.5px] leading-relaxed text-heading hover:text-accent-text duration-500 transition-colors block max-w-xl"
                    >
                      {entry.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 sm:pt-8 select-none">
              <Link
                href={getPersonaUrl('wanderer', '/blogs')}
                className="group inline-flex items-center gap-2 font-mono text-[10px] sm:text-[10.5px] uppercase tracking-widest text-accent-text hover:underline"
                id="enter-notebook-feed-link"
              >
                <span>Enter Complete Notebook Feed</span>
                <span className="font-sans inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </section>
        </div>

        {/* RIGHT SIDE: ATMOSPHERIC RAIL (DESKTOP ONLY) */}
        <aside id="desktop-atmospheric-rail" className="hidden lg:flex flex-col lg:col-span-4 pl-12 border-l border-border-subtle dark:border-border-subtle/15 h-[calc(100vh-200px)] sticky top-36 select-none justify-between my-4 pt-10 pb-6">
          <div className="space-y-3.5 pr-4">
            <span className="text-[9.5px] font-sans tracking-[0.25em] text-accent-text/85 uppercase font-medium block">
              03:12 AM
            </span>
            <p className="font-spectral text-[13px] leading-[1.75] text-body italic font-light">
              Rain against the train window again.
            </p>
            <p className="font-spectral text-[13px] leading-[1.75] text-body italic font-light pb-2">
              Lately I have been revisiting old voice recordings and unfinished notes.
            </p>
          </div>

          <div className="grow h-32" />

          <div className="space-y-4 py-8 border-y border-border-subtle dark:border-border-subtle/15 pr-4">
            <span className="text-[9.5px] font-sans tracking-[0.25em] text-accent-text/85 uppercase font-medium block">
              LETTERS
            </span>
            <p className="font-spectral font-light text-[13px] leading-[1.75] text-body italic">
              Sometimes I send quiet letters about memories, places, unfinished thoughts, and the things I notice when life slows down.
            </p>
            <LettersForm />
            <p className="text-[10.5px] text-body/70 font-mono tracking-wider">
              No noise. Just occasional reflections.
            </p>
          </div>

          <div className="grow h-32" />

          <div className="text-[10.5px] font-mono text-body/60 italic pt-1 pr-4">
            Last updated late at night.
          </div>
        </aside>
      </div>

      {/* TEMPORAL FOOTNOTE */}
      <footer id="temporal-detail" className="mt-48 md:mt-64 pt-8 border-t border-border-subtle dark:border-border-subtle/15 flex flex-col items-center text-center select-none opacity-60">
        <p className="text-[10.5px] font-mono text-body/60 italic tracking-wide">
          written from a quiet carriage • updated late last night • May 2026
        </p>
      </footer>
    </div>
  );
}
