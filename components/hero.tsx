import { Fragment } from 'react';
import { HeroImageStack } from '@/components/hero-image-stack';
import type { HeroContent } from '@/lib/types';

interface HeroProps {
  hero: HeroContent;
}

const WORD_STYLES = [
  'bg-accent -rotate-2 sm:-rotate-3 sm:-translate-y-1 text-[0.95em] sm:text-[0.92em]',
  'bg-sea-blue rotate-2 sm:translate-y-2 text-[1.12em]',
  'bg-accent-green -rotate-1 sm:-translate-y-0.5 text-[1em]',
] as const;

/**
 * Homepage hero: a two-column grid with the headline, supporting copy,
 * and bullet points on the left, and a photo with a soft circle behind it
 * on the right. Styled with the site's editorial serif aesthetic.
 */
export function Hero({ hero }: HeroProps) {
  const words = hero.headline.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);

  return (
    <section className="grid grid-cols-1 items-start gap-12 py-6 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:py-6">
      <div className="flex flex-col justify-center lg:pr-6">
        {hero.greeting ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:text-sm">
            {hero.greeting}
          </p>
        ) : null}

        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-normal leading-[1.12] tracking-tight text-paper sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
          {hero.name ? <b>{hero.name}</b> : null}
          {words.map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              <span
                className="hero-word-in mb-1 block sm:mb-0 sm:inline-block"
                style={{ animationDelay: `${index * 130}ms` }}
              >
                <span
                  className={`inline-block rounded-sm px-2 py-1 text-night transition-transform duration-300 ease-out hover:rotate-0 hover:scale-105 active:rotate-0 active:scale-105 sm:px-3 ${WORD_STYLES[index % WORD_STYLES.length]}`}
                >
                  {word}
                </span>
              </span>
              {index < words.length - 1 ? ' ' : ''}
            </Fragment>
          ))}
        </h1>

        {hero.supporting ? (
          <p
            className="hero-word-in mt-6 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl"
            style={{ animationDelay: '420ms' }}
          >
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
      </div>

      <div className="relative hidden items-center justify-center lg:flex">
        <div
          aria-hidden
          className="absolute h-[440px] w-[440px] rounded-full border border-tinted/20"
        />
        <HeroImageStack
          images={hero.gallery.length > 0 ? hero.gallery : [hero.image]}
        />
      </div>
    </section>
  );
}
