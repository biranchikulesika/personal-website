import type { SiteContent, WritingItem } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "./icons";
import { LandscapeGallery } from "./landscape-gallery";
import { NewsletterForm } from "./newsletter-form";
import { EssayCover } from "./ui/essay-cover";

interface AboutPageProps {
  site: SiteContent;
  featuredWriting: WritingItem[];
}

const ABOUT_GALLERY_IMAGES = [
  {
    src: "/groupphotowithfriends.webp",
    alt: "Biranchi with friends",
    caption: "With friends & university companions",
  },
  {
    src: "/melayingonsciencemuseum.webp",
    alt: "Biranchi at the science museum",
    caption: "Moments of curiosity at the science museum",
  },
];

const CURIOSITIES = [
  "Linux",
  "Systems thinking",
  "Writing things down",
  "Slow internet",
  "Craft & attention",
  "Thoughtful conversations",
  "Late nights",
  "Digital gardens",
  "Curiosity",
  "Plain text",
  "Building in public",
];

/**
 * About page view:
 * 1. Bold hero headline with introductory copy and 2-column image mosaic
 * 2. Dedicated newsletter card
 * 3. 3-column featured essays & focus grid
 * 4. Rich background story & philosophy prose
 * 5. Small human details & curiosities cluster
 */
export function AboutPageView({ site, featuredWriting }: AboutPageProps) {
  return (
    <section
      aria-label="About Biranchi Kulesika"
      className="container-site py-12 md:py-20"
    >
      {/* 1. Hero Section */}
      <div className="mb-20 grid grid-cols-1 items-start gap-8 lg:mb-28 lg:grid-cols-2 lg:gap-4">
        <div>
          <h1 className="font-serif text-4xl font-normal leading-[1.1] tracking-tight text-paper sm:text-5xl md:text-6xl xl:text-7xl">
            This is me,
            <span className="block font-serif italic text-ink-soft/90">
              outside the internet
            </span>
          </h1>

          <div className="mt-8 space-y-6 text-lg leading-relaxed text-ink-soft md:text-xl">
            <p>
              I’m <b className="font-semibold text-paper">Biranchi Kulesika</b>.
              I’m an aspiring software developer by day, a cybersecurity
              enthusiast by night, and a student of philosophy whenever I’m
              confused.
            </p>
            <p>
              You’ll often find me building tools nobody uses and writing atomic
              essays nobody reads.
            </p>
          </div>

          <div className="mt-8">
            <LandscapeGallery images={ABOUT_GALLERY_IMAGES} priority />
          </div>
        </div>

        {/* Profile / Atmosphere mosaic grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="group relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-night-soft shadow-2xl ring-1 ring-tinted/20">
            <Image
              src="/selfiewithmiku.webp"
              alt="Biranchi with Miku"
              fill
              sizes="(min-width: 1024px) 240px, 45vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="group relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-night-soft shadow-2xl ring-1 ring-tinted/20">
            <Image
              src="/selfiewithblessie.webp"
              alt="Biranchi with Blessie"
              fill
              sizes="(min-width: 1024px) 240px, 45vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="group relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-night-soft shadow-2xl ring-1 ring-tinted/20">
            <Image
              src="/selfiewithfriends.webp"
              alt="Biranchi with friends"
              fill
              sizes="(min-width: 1024px) 240px, 45vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="group relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-night-soft shadow-2xl ring-1 ring-tinted/20">
            <Image
              src="/selfiewithbhabani.webp"
              alt="Biranchi with Bhabani"
              fill
              sizes="(min-width: 1024px) 240px, 45vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* 2. Newsletter Banner */}
      <div className="mb-20 rounded-3xl border border-tinted/20 bg-night-soft p-8 shadow-2xl md:p-12 lg:mb-28">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex-1 md:min-w-105">
            <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl lg:text-[34px] md:whitespace-nowrap">
              Things I Keep Thinking About
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
              {site.hero.newsletter.note}
            </p>
          </div>
          <div className="w-full flex-1 md:max-w-sm lg:max-w-md">
            <NewsletterForm
              newsletter={site.hero.newsletter}
              showNote={false}
            />
          </div>
        </div>
      </div>

      {/* 3. Featured Spots / Selected Writing */}
      <div className="mx-auto mb-20 max-w-4xl lg:mb-28">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl">
            Selected essays & ideas
          </h2>
          <Link
            href="/scribble"
            className="group inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent"
          >
            Explore all on Scribble
            <ArrowRightIcon className="h-4 w-4 text-sea-blue transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredWriting.slice(0, 3).map((item) => (
            <Link
              key={item.slug}
              href={`/p/${item.slug}`}
              className="group flex flex-col rounded-2xl border border-tinted/20 bg-post-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <EssayCover title={item.title} coverImage={item.coverImage} />
              <h3 className="mt-4 font-serif text-lg font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                {item.title}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-ink-soft">
                {item.tags.join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Bio Section */}
      <div className="mx-auto mb-20 max-w-3xl lg:mb-28">
        <h2 className="mb-6 font-serif text-3xl font-normal text-paper md:text-4xl">
          My background
        </h2>

        <div className="space-y-6 text-base leading-[1.85] text-paper/85 md:text-lg">
          <p>
            I spend a lot of time building things, taking them apart, writing
            things down, and wondering why we build certain things in the first
            place. I like software because it is a strange intersection of
            logic, creativity, and human behaviour. A badly designed system can
            quietly shape how thousands of people think and behave. A
            well-designed one can simply get out of the way.
          </p>
          <p>
            I care about independence. Not the dramatic kind. The quieter kind
            that comes from being able to think for yourself, learn without
            being told what to learn, and question things that everyone else has
            already accepted.
          </p>
          <p>
            Curiosity matters to me more than certainty. I would rather
            understand something badly and keep digging than pretend I
            understand it because everyone around me seems convinced. Most of
            what I know started as an unnecessary question that refused to leave
            me alone.
          </p>
          <p>
            I also have a slightly inconvenient relationship with the internet.
            I like what the web can be, but I dislike what it often becomes.
            Everything wants your attention. Everything wants to be faster,
            louder, more addictive, more optimised. I don&apos;t find that
            particularly impressive.
          </p>

          <blockquote className="my-8 rounded-2xl border-l-4 border-sea-blue bg-night-soft/60 p-6 font-serif text-xl italic leading-relaxed text-paper md:text-2xl">
            “No one is perfect. No one ever will be. Leave some room for
            mistakes”
          </blockquote>

          <p>
            That probably explains this website. It is not meant to be a
            perfectly curated version of me. It is a place to build, write,
            think, experiment, and leave traces of things I might otherwise
            forget.
          </p>
          <p>
            You&apos;ll often find me building tools nobody uses and writing
            atomic essays nobody reads.
          </p>
          <p>I don&apos;t mind.</p>
          <p>
            There is something satisfying about making things simply because you
            wanted to understand whether you could.
          </p>
          <p>
            I’m still figuring out what I believe about most things. That is
            intentional. I think changing your mind after learning something new
            is a feature, not a failure.
          </p>
          <p>
            So this place is less of a portfolio and more of a record of that
            process.
          </p>
          <p>
            Things I built. Things I learned. Things I questioned. Things I
            changed my mind about.
          </p>
          <p>And, occasionally, things I still have no idea about.</p>

          <p className="pt-4">
            Follow along on{" "}
            <a
              href="https://www.linkedin.com/in/biranchikulesika"
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper underline decoration-tinted/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              LinkedIn
            </a>
            , explore the{" "}
            <Link
              href="/library"
              className="text-paper underline decoration-tinted/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              Library
            </Link>
            , or say hello via{" "}
            <a
              href="mailto:hello@kulesika.in"
              className="text-paper underline decoration-tinted/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              email
            </a>
            .
          </p>
        </div>
      </div>

      {/* 5. Small Details & Curiosities */}
      <div className="mx-auto max-w-2xl border-t border-tinted/20 pt-12 text-center">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Small details & curiosities
        </h2>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {CURIOSITIES.map((item) => (
            <span
              key={item}
              className="font-serif text-base italic text-ink-soft transition-colors duration-200 hover:text-accent"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
