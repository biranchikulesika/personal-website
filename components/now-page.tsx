import Link from 'next/link';

interface NowBookCardProps {
  title: string;
  author: string;
  description: string;
  year?: string;
}

function InlineBookCard({ title, author, description, year }: NowBookCardProps) {
  return (
    <div className="my-8 flex flex-col items-center gap-6 rounded-2xl border border-tinted bg-cream p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:flex-row sm:items-start md:p-6">
      {/* Book Cover */}
      <div className="relative flex aspect-[2/3] w-28 shrink-0 flex-col justify-between overflow-hidden rounded-lg border border-tinted bg-paper p-3 shadow-sm sm:w-32">
        <span
          aria-hidden
          className="absolute bottom-0 left-0 top-0 w-2 border-r border-tinted/60 bg-cream/70"
        />
        <div className="pl-1">
          <span className="font-serif text-xs italic leading-tight text-ink line-clamp-3">
            {title}
          </span>
        </div>
        <div className="border-t border-tinted/40 pl-1 pt-1.5 text-[10px] text-ink-soft truncate">
          {author}
        </div>
      </div>

      {/* Book Metadata */}
      <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
        <h4 className="font-serif text-lg font-normal leading-snug text-ink md:text-xl">
          {title}
        </h4>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-soft">
          <span>{author}</span>
          {year && (
            <>
              <span className="text-ink-soft/40">·</span>
              <span>{year}</span>
            </>
          )}
        </div>
        <div className="my-2.5 h-0.5 w-10 bg-tinted" aria-hidden />
        <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
    </div>
  );
}

export function NowPageView() {
  return (
    <div className="container-site py-10 md:py-16">
      <main className="mx-auto max-w-[760px]">
        {/* Header */}
        <header className="mb-14">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-ink md:text-5xl lg:text-6xl">
            Now
          </h1>
          <h2 className="mt-3 font-serif text-xl font-light italic leading-relaxed text-ink-soft md:text-2xl">
            A sporadically updated log of what I’m reading, exploring, and thinking about
          </h2>
        </header>

        {/* Timeline Log Entries */}
        <div className="space-y-16">
          {/* Entry: August 2026 */}
          <section className="relative ml-2 border-l border-dashed border-tinted pl-8 md:ml-4 md:pl-12">
            {/* Timeline node dot */}
            <span
              aria-hidden
              className="absolute -left-[7px] top-2 h-3.5 w-3.5 rounded-full border-2 border-sea-blue bg-cream shadow-sm"
            />

            <article className="space-y-5 text-base leading-[1.85] text-ink-soft md:text-lg">
              <h3 className="font-serif text-2xl font-normal text-ink md:text-3xl">
                August 2026
              </h3>

              <p>
                I’m writing this during a quiet evening in Odisha, India. The monsoon has settled into a gentle cadence, and the air is heavy with the smell of wet earth and night-blooming jasmine. I have a fresh cup of tea on the desk and a few uninterrupted hours to think clearly for the first time in weeks.
              </p>

              <p>
                Lately, my mind has been consumed by a paradox: we are living through an unprecedented acceleration in software capabilities. AI agents write code, orchestrate workflows, and generate interfaces in seconds. And yet, the human side of software — the clarity of thought, the respect for attention, the patience to understand why something works — feels more endangered than ever.
              </p>

              <p>
                It is easy to get caught up in the panic of continuous output. But when generation becomes cheap, discernment becomes priceless. I find myself returning to fundamental questions: What kind of digital spaces actually nurture deep thinking? How do we build tools that act as quiet bicycles for the mind rather than slot machines for our dopamine receptors?
              </p>

              <blockquote className="my-8 border-y border-tinted py-6 text-center font-serif text-lg italic text-ink md:text-xl">
                “When software generation becomes effortless, the only real currency left is deliberate attention and genuine craft.”
              </blockquote>

              <p>
                To ground these thoughts, I’ve been reading Nicholas Carr’s classic examination of how digital mediums alter neuroplasticity and reading depth:
              </p>

              <InlineBookCard
                title="The Shallows"
                author="Nicholas Carr"
                year="2025"
                description="How the internet reshapes our neural pathways, fracturing attention and trading contemplative depth for rapid, superficial information skimming."
              />

              <p>
                Alongside technology, I’ve also been trying to better understand the economic structures that govern human work and leisure. It feels irresponsible to watch automation reshape the labour market without understanding the fundamental mechanisms of value and distribution.
              </p>

              <InlineBookCard
                title="Economics: The User’s Guide"
                author="Ha-Joon Chang"
                year="2025"
                description="A lucid, pluralistic guide through classical, Keynesian, institutionalist, and Marxist economic schools, explaining how markets really work."
              />

              <p>
                On this website, I’ve been rebuilding everything from first principles. Stripping away unnecessary frameworks, simplifying layouts, and making sure every component has breathing room and purpose.
              </p>
            </article>
          </section>

          {/* Entry: January 2026 */}
          <section className="relative ml-2 border-l border-dashed border-tinted pl-8 md:ml-4 md:pl-12">
            {/* Timeline node dot */}
            <span
              aria-hidden
              className="absolute -left-[7px] top-2 h-3.5 w-3.5 rounded-full border-2 border-tinted bg-cream shadow-sm"
            />

            <article className="space-y-5 text-base leading-[1.85] text-ink-soft md:text-lg">
              <h3 className="font-serif text-2xl font-normal text-ink md:text-3xl">
                January 2026
              </h3>

              <p>
                Entered the new year with a resolution to write more things down in public. For years, I kept notebooks filled with half-formed observations and architectural sketches that never saw the light of day because they weren’t “finished enough.”
              </p>

              <p>
                I created{' '}
                <Link
                  href="/scribble"
                  className="text-ink underline decoration-tinted underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  Scribble
                </Link>{' '}
                as an antidote to that hesitation. It is designed not as a chronological feed of hot takes, but as a digital garden — a place where notes can start small, get tended slowly over time, and evolve alongside my own understanding.
              </p>

              <p>
                During the winter break, I spent hours immersed in Donella Meadows’ masterpiece on systems theory. It has permanently altered how I view software architecture, teams, and feedback loops:
              </p>

              <InlineBookCard
                title="Thinking in Systems"
                author="Donella Meadows"
                year="2023"
                description="A primer on seeing wholes rather than isolated parts, understanding stocks and flows, and finding leverage points in complex systems."
              />

              <blockquote className="my-8 border-y border-tinted py-6 text-center font-serif text-lg italic text-ink md:text-xl">
                “Quality is a trade: you give up speed and the comfort of ‘done,’ and in return you get work that can be revisited with pride.”
              </blockquote>

              <p>
                I’m learning that the fastest way to build something durable is to slow down, protect morning hours for deep focus, and reject the temptation to optimize prematurely.
              </p>
            </article>
          </section>

          {/* Entry: August 2025 */}
          <section className="relative ml-2 border-l border-dashed border-tinted pl-8 md:ml-4 md:pl-12">
            {/* Timeline node dot */}
            <span
              aria-hidden
              className="absolute -left-[7px] top-2 h-3.5 w-3.5 rounded-full border-2 border-tinted bg-cream shadow-sm"
            />

            <article className="space-y-5 text-base leading-[1.85] text-ink-soft md:text-lg">
              <h3 className="font-serif text-2xl font-normal text-ink md:text-3xl">
                August 2025
              </h3>

              <p>
                A year ago, I began stepping back from mainstream social media platforms. The algorithmic feeds were taking more mental bandwidth than they gave back in genuine insight.
              </p>

              <p>
                I started exploring the IndieWeb movement and reading about personal digital gardens. There is something deeply restorative about owning your own space on the web — choosing your own typography, crafting your own layouts, and sharing writing directly with people without intermediaries.
              </p>

              <InlineBookCard
                title="Technopoly"
                author="Neil Postman"
                year="2024"
                description="A prophetic inquiry into what happens when culture surrenders unconditionally to technology, efficiency, and invisible technological imperatives."
              />

              <p>
                This space began as a quiet sketch. It remains a work in progress, and that is precisely the point.
              </p>
            </article>
          </section>
        </div>

        {/* Footer info & Now Movement Note */}
        <footer className="mt-20 border-t border-tinted pt-10 text-center">
          <p className="text-sm text-ink-soft">
            This page is inspired by the{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-tinted underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              /now movement
            </a>{' '}
            started by Derek Sivers.
          </p>
          <p className="mt-3 font-serif text-base italic text-ink-soft/70">
            Odisha, India · Updated August 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
