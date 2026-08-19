import type { HeroContent } from '@/lib/types';
import { NewsletterForm } from './newsletter-form';

interface HeroProps {
  hero: HeroContent;
}

/**
 * Homepage hero. Kadlac-inspired layout: a two-column grid with the
 * headline, supporting copy, bullet points, and newsletter CTA on the
 * left, and a photo with a soft circle behind it on the right. Styled with
 * the site's current serif aesthetic.
 */
export function Hero({ hero }: HeroProps) {
  return (
    <section className="grid grid-cols-1 items-center gap-12 py-6 lg:min-h-[calc(100dvh-7rem)] lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <div className="flex flex-col justify-center lg:pr-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:text-sm">
          {hero.greeting}
        </p>

        <h1 className="mt-5 max-w-2xl font-serif text-3xl font-normal leading-[1.08] tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[3.75rem] xl:text-[4.25rem]">
          {hero.name ? <b>{hero.name}</b> : null}
          {hero.headline}
        </h1>

        {hero.supporting ? (
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl">
            {hero.supporting}
          </p>
        ) : null}

        {hero.points.length > 0 && (
          <div className="mt-6 max-w-xl space-y-3">
            {hero.points.map((point) => (
              <p
                key={point}
                className="font-serif text-lg italic leading-relaxed text-ink-soft md:text-xl"
              >
                {point}
              </p>
            ))}
          </div>
        )}

        <div className="mt-10 md:mt-12">
          <NewsletterForm newsletter={hero.newsletter} />
        </div>
      </div>

      <div className="relative hidden items-center justify-center lg:flex">
        <svg
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2"
          viewBox="0 0 480 480"
        >
          <circle cx="240" cy="240" r="240" fill="var(--color-cream)" />
        </svg>
        <div className="relative z-10 aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-2xl shadow-md ring-1 ring-tinted">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img for the local hero portrait */}
          <img
            src={hero.image.src}
            alt={hero.image.alt}
            className="h-full w-full object-cover object-[center_60%]"
          />
        </div>
      </div>
    </section>
  );
}