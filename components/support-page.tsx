'use client';

import { useState } from 'react';
import { HeartIcon } from './icons';

const WHERE_MONEY_GOES = [
  {
    title: 'Time to think',
    lead: 'Some of the best work starts with doing nothing that looks productive.',
    body: 'Support helps create uninterrupted time to read deeply, work through difficult problems, explore ideas, and write without chasing clicks, trends, or algorithms.',
  },
  {
    title: 'Keeping the lights on',
    lead: 'Domains, hosting, storage, development tools, security, and all the other invisible machinery behind a website still cost money.',
    body: 'Your contribution helps keep this place running without ads or commercial compromises.',
  },
  {
    title: 'Books & research',
    lead: 'A lot of what I write begins with something I read.',
    body: 'Support helps me buy books, papers, and other material that gets read, annotated, questioned, and eventually finds its way into the Library or something I write.',
  },
  {
    title: 'No ads. No sponsors.',
    lead: 'I don’t want this website to become another place competing for your attention.',
    body: 'Contributions help me keep it free from advertising, sponsored opinions, affiliate clutter, and the subtle pressure to make everything more clickable.',
  },
];

export function SupportPageView() {
  const [amount, setAmount] = useState<string>('100');
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const numAmount = Number(amount) || 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (numAmount >= 10) {
      setSubmitted(true);
    }
  }

  return (
    <div className="container-site py-12 md:py-20">
      {/* 1. Side-by-side Hero: Text on Left, Payment Box on Right */}
      <section className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left Column: Narrative Copy */}
        <div className="lg:col-span-6 lg:pr-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:text-sm">
            PATRONAGE & SUPPORT
          </p>
          <h1 className="mt-4 font-serif text-3xl font-normal leading-[1.12] tracking-tight text-ink sm:text-4xl md:text-5xl xl:text-[3.5rem]">
            Help me keep this corner of the web independent.
          </h1>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>
              Everything I make here is open to everyone. There are no paywalls, ads, sponsored posts, or attention tricks.
            </p>
            <p>
              If something I’ve built or written has been useful, interesting, or simply worth your time, you can help keep it going.
            </p>
            <p>
              Your support goes toward the rather unglamorous things that make an independent website possible: servers, domains, books, research material, software, and most importantly, time to think and make things without having to turn every idea into a product.
            </p>
          </div>
        </div>

        {/* Right Column: Payment Box */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-tinted bg-cream p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-paper text-accent shadow-sm ring-1 ring-tinted">
                  <HeartIcon className="h-7 w-7 fill-accent/20" />
                </div>
                <h2 className="mt-5 font-serif text-2xl font-normal text-ink md:text-3xl">
                  Thank you deeply{name ? `, ${name}` : ''}!
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-ink-soft">
                  Your simulated contribution of{' '}
                  <b className="font-semibold text-ink">₹{amount}</b> helps keep
                  this work independent, thoughtful, and deliberate.
                </p>
                {message && (
                  <blockquote className="mx-auto mt-5 max-w-xs rounded-xl border border-tinted bg-paper p-3.5 font-serif text-sm italic text-ink-soft">
                    “{message}”
                  </blockquote>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-accent"
                >
                  Make another contribution
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Custom Amount Input */}
                <div>
                  <label
                    htmlFor="support-amount"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
                  >
                    Contribution Amount
                  </label>
                  <div className="mt-2 flex items-center rounded-2xl bg-paper px-4 py-3 ring-1 ring-tinted transition-all focus-within:ring-2 focus-within:ring-ink">
                    <span className="font-serif text-2xl font-normal text-ink">₹</span>
                    <input
                      id="support-amount"
                      type="number"
                      min={10}
                      step={1}
                      required
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="ml-3 w-full bg-transparent font-serif text-2xl font-normal text-ink placeholder:font-sans placeholder:text-base placeholder:text-ink-soft/40 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      INR
                    </span>
                  </div>
                </div>

                {/* Optional Name */}
                <div>
                  <label
                    htmlFor="supporter-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    id="supporter-name"
                    type="text"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 ring-1 ring-tinted focus:outline-none focus:ring-2 focus:ring-ink"
                  />
                </div>

                {/* Optional Note */}
                <div>
                  <label
                    htmlFor="supporter-message"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
                  >
                    Leave a note (Optional)
                  </label>
                  <textarea
                    id="supporter-message"
                    rows={2}
                    placeholder="Share a thought, feedback on an essay, or a friendly hello..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1.5 w-full resize-none rounded-xl bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 ring-1 ring-tinted focus:outline-none focus:ring-2 focus:ring-ink"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={numAmount < 10}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-base font-semibold text-cream shadow-sm transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-ink"
                >
                  <HeartIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>
                    {numAmount >= 10
                      ? `Support with ₹${amount}`
                      : 'Support (Minimum ₹10)'}
                  </span>
                </button>

                <p className="text-center text-xs text-ink-soft/80">
                  Contributions are direct, independent, and handled with privacy.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 2. Where does the support go? */}
      <section className="mx-auto mt-20 max-w-4xl lg:mt-28">
        <h2 className="text-center font-serif text-2xl font-normal text-ink md:text-3xl lg:text-4xl">
          Where does the support go?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-ink-soft md:text-lg">
          Small contributions help keep this space independent and give me more room to build, read, experiment, and write.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {WHERE_MONEY_GOES.map((item) => (
            <div
              key={item.title}
              className="flex flex-col justify-between rounded-2xl border border-tinted bg-cream p-6 sm:p-7 shadow-sm"
            >
              <div>
                <h3 className="font-serif text-xl font-normal text-ink">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm font-medium text-ink/90">
                  {item.lead}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Closing Note */}
      <footer className="mx-auto mt-20 max-w-2xl border-t border-tinted pt-12 text-center">
        <p className="font-serif text-lg font-medium text-ink md:text-xl">
          Thank you for reading, sharing, supporting, or simply being here.
        </p>
      </footer>
    </div>
  );
}
