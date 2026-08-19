'use client';

import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { NEWSLETTER_PERSONA_CONFIGS } from './NewsletterConfig';
import type { NewsletterPersonaConfig } from './NewsletterConfig';

interface ThemeClasses {
  wrapper: string;
  brandName: string;
  title: string;
  description: string;
  submittedCard: string;
  submittedLabel: string;
  submittedTitle: string;
  submittedDescription: string;
  input: string;
  submitBtn: string;
  spinner: string;
  divider: string;
  sectionHeading: string;
  bullet: string;
  expectationText: string;
  letterDivider: string;
  letterTitle: string;
  letterDate: string;
  footerMeta: string;
  footerMetaLabel: string;
  tagline: string;
}

const PERSONA_THEMES: Record<string, ThemeClasses> = {
  builder: {
    wrapper: 'font-mono',
    brandName: 'text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em]',
    title: 'text-2xl md:text-3xl lg:text-4xl font-medium dark:text-neutral-100 text-[#111111] leading-tight tracking-tight max-w-2xl',
    description: 'text-sm dark:text-neutral-450 text-[#5E5A53] leading-relaxed max-w-xl',
    submittedCard: 'p-5 rounded-sm border border-neutral-300 dark:border-neutral-900 bg-neutral-200/10 dark:bg-neutral-900/5',
    submittedLabel: 'text-[10px] dark:text-neutral-500 text-[#8B867C] tracking-wide font-medium uppercase',
    submittedTitle: 'text-sm dark:text-neutral-200 text-[#111111] font-semibold',
    submittedDescription: 'text-xs dark:text-neutral-500 text-[#6E6A64]',
    input: 'w-full bg-transparent border-b dark:border-neutral-800 border-neutral-300 px-1 py-3 dark:text-neutral-200 text-[#111111] focus:outline-none focus:dark:border-neutral-500 focus:border-neutral-700 transition-colors duration-500 font-mono text-sm placeholder:dark:text-neutral-700 placeholder:text-neutral-400/80 rounded-none shadow-none',
    submitBtn: 'p-2 dark:text-neutral-500 text-[#8B867C] hover:dark:text-neutral-300 hover:text-neutral-950 transition-colors duration-300',
    spinner: 'w-4 h-4 border-2 border-t-transparent dark:border-neutral-400 border-neutral-700 rounded-full animate-spin',
    divider: 'border-t border-[#E7E4DD]/70 dark:border-neutral-900/30',
    sectionHeading: 'text-[10px] dark:text-neutral-500 text-[#8B867C] uppercase tracking-[0.25em] font-semibold',
    bullet: 'text-[10px] dark:text-neutral-600 text-neutral-400/80',
    expectationText: 'text-xs dark:text-neutral-300 text-[#222222] font-medium',
    letterDivider: 'border-b border-dashed dark:border-neutral-900/20 border-neutral-300/40',
    letterTitle: 'text-xs dark:text-neutral-300 text-[#222222] font-semibold',
    letterDate: 'text-[10px] dark:text-neutral-550 text-[#8B867C]/80 shrink-0 font-mono',
    footerMeta: 'dark:text-neutral-500 text-[#8B867C]',
    footerMetaLabel: 'dark:text-neutral-600 text-[#9C958A]',
    tagline: 'text-[10px] font-mono dark:text-neutral-600 text-[#A29D93] uppercase tracking-widest',
  },
  operator: {
    wrapper: 'font-mono',
    brandName: 'text-[10px] font-bold text-primary/80 uppercase tracking-[0.35em]',
    title: 'text-2xl md:text-3xl lg:text-4xl font-medium dark:text-[#a3c2af] text-[#1F2822] leading-tight tracking-tight max-w-2xl',
    description: 'text-sm dark:text-[#6d8775]/90 text-[#7c6e62]/90 leading-relaxed max-w-xl',
    submittedCard: 'p-5 rounded-xs border dark:border-[#1e2722] border-[#D6DED5] dark:bg-[#111612] bg-[#EDF1EC]',
    submittedLabel: 'text-[10px] text-primary/70 tracking-wide font-medium uppercase',
    submittedTitle: 'text-sm text-foreground font-semibold',
    submittedDescription: 'text-xs text-primary/70',
    input: 'w-full bg-transparent border-b border-border px-1 py-3 text-foreground focus:outline-none focus:border-primary transition-colors duration-500 font-mono text-sm placeholder:text-primary/50 rounded-none shadow-none',
    submitBtn: 'p-2 text-primary/70 hover:text-foreground transition-colors duration-300',
    spinner: 'w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin',
    divider: 'border-t border-border',
    sectionHeading: 'text-[10px] text-primary/80 uppercase tracking-[0.25em] font-semibold',
    bullet: 'text-[10px] text-primary/50',
    expectationText: 'text-xs text-foreground/80 font-medium',
    letterDivider: 'border-b border-dashed border-border/40',
    letterTitle: 'text-xs text-foreground/80 font-medium',
    letterDate: 'text-[10px] text-primary/80 shrink-0 font-mono',
    footerMeta: 'text-primary',
    footerMetaLabel: 'text-primary/70',
    tagline: 'text-[9px] font-mono text-primary/60 uppercase tracking-[0.3em]',
  },
  thinker: {
    wrapper: 'font-sans',
    brandName: 'text-[10px] font-mono dark:text-[#A7A39B] text-[#6F7175] uppercase tracking-[0.35em] font-light',
    title: 'text-2xl md:text-3xl lg:text-4xl font-serif dark:text-[#e5e5e5] text-[#2F3134] leading-tight tracking-tight max-w-2xl font-normal',
    description: 'text-sm dark:text-[#A7A39B]/90 text-[#6F7175]/90 leading-relaxed max-w-xl font-light',
    submittedCard: 'p-5 rounded-2xl border dark:border-[rgba(255,255,255,0.05)] border-[#E2DFDA] dark:bg-[rgba(255,255,255,0.01)] bg-[#ECEAE7]',
    submittedLabel: 'text-[9px] font-mono dark:text-[#A7A39B] text-[#6F7175] tracking-widest uppercase',
    submittedTitle: 'text-base font-serif dark:text-[#D7D4CE] text-[#2F3134]',
    submittedDescription: 'text-xs dark:text-[#807D76] text-[#8C8F93]',
    input: 'w-full bg-transparent border-b dark:border-[rgba(255,255,255,0.08)] border-[#E2DFDA] px-1 py-3 dark:text-[#D7D4CE] text-[#2F3134] focus:outline-none focus:dark:border-[#A7A39B] focus:border-[#6F7175] transition-colors duration-500 font-sans text-sm font-light placeholder:dark:text-[#807D76]/50 placeholder:text-stone-400/80 rounded-none shadow-none',
    submitBtn: 'p-2 dark:text-[#A7A39B] text-[#6F7175] hover:dark:text-[#e5e5e5] hover:text-[#2F3134] transition-colors duration-300',
    spinner: 'w-4 h-4 border-2 border-t-transparent dark:border-[#A7A39B] border-[#6F7175] rounded-full animate-spin',
    divider: 'border-t dark:border-[rgba(255,255,255,0.04)] border-[#E2DFDA]',
    sectionHeading: 'text-[10px] font-mono dark:text-[#A7A39B] text-[#6F7175] uppercase tracking-[0.25em] font-semibold',
    bullet: 'text-[10px] dark:text-[#A7A39B]/40 text-[#6F7175]/40',
    expectationText: 'text-xs dark:text-[#D7D4CE]/90 text-[#2F3134]/90 font-light',
    letterDivider: 'border-b border-dashed dark:border-[rgba(255,255,255,0.02)] border-[#E2DFDA]/50',
    letterTitle: 'text-xs font-serif dark:text-[#D7D4CE]/90 text-[#2F3134]/90',
    letterDate: 'text-[10px] font-mono dark:text-[#807D76] text-[#8C8F93]/70 shrink-0',
    footerMeta: 'dark:text-[#A7A39B] text-[#6F7175]',
    footerMetaLabel: 'dark:text-[#A7A39B]/50 text-[#5F6165]',
    tagline: 'text-[9px] font-mono dark:text-[#807D76] text-[#8C8F93]/80 uppercase tracking-[0.3em]',
  },
  wanderer: {
    wrapper: 'font-spectral',
    brandName: 'text-[10px] font-sans dark:text-[#B97A56] text-[#9d613c] uppercase tracking-[0.35em] font-semibold',
    title: 'text-2xl md:text-3xl lg:text-4xl font-serif dark:text-[#E1D5C8] text-[#43382F] leading-tight tracking-tight max-w-2xl italic',
    description: 'text-sm dark:text-[#B6A798]/90 text-[#7c6e62]/90 leading-relaxed max-w-xl font-light',
    submittedCard: 'p-6 rounded-xl border dark:border-[#26201B] border-[#E5DCCF] dark:bg-[#201B17] bg-[#EEE7DE]',
    submittedLabel: 'text-[10px] font-mono dark:text-[#B97A56] text-[#9d613c] tracking-widest uppercase',
    submittedTitle: 'text-lg italic dark:text-[#E1D5C8] text-[#43382F]',
    submittedDescription: 'text-xs dark:text-[#B6A798]/80 text-[#7c6e62]/80',
    input: 'w-full bg-transparent border-b dark:border-[#26201B] border-[#E5DCCF] px-1 py-3 dark:text-[#E1D5C8] text-[#43382F] focus:outline-none focus:dark:border-[#B97A56] focus:border-[#9d613c] transition-colors duration-500 font-spectral italic text-base placeholder:dark:text-[#B6A798]/40 placeholder:text-[#7c6e62]/50 rounded-none shadow-none',
    submitBtn: 'p-2 dark:text-[#B6A798] text-[#7c6e62] hover:dark:text-[#B97A56] hover:text-[#9d613c] transition-colors duration-300',
    spinner: 'w-4 h-4 border-2 border-t-transparent dark:border-[#B97A56] border-[#9d613c] rounded-full animate-spin',
    divider: 'border-t dark:border-[#26201B] border-[#E5DCCF]',
    sectionHeading: 'text-[10px] font-sans dark:text-[#B97A56] text-[#9d613c] uppercase tracking-[0.25em] font-semibold',
    bullet: 'text-[10px] dark:text-[#B6A798]/30 text-[#7c6e62]/30',
    expectationText: 'text-xs dark:text-[#E1D5C8]/80 text-[#43382F]/80 font-light',
    letterDivider: 'border-b border-dashed dark:border-[#26201B]/50 border-[#E5DCCF]/50',
    letterTitle: 'text-sm dark:text-[#E1D5C8]/95 text-[#43382F]/95 font-medium',
    letterDate: 'text-[10px] font-mono dark:text-[#B6A798] text-[#7c6e62]/70 shrink-0',
    footerMeta: 'dark:text-[#B6A798] text-[#7c6e62]',
    footerMetaLabel: 'dark:text-[#B6A798]/70 text-[#7c6e62]/70',
    tagline: 'text-[9px] font-mono dark:text-[#B6A798]/70 text-[#7c6e62]/80 uppercase tracking-[0.3em]',
  },
};

export function createNewsletterPage(persona: string) {
  const config = NEWSLETTER_PERSONA_CONFIGS[persona];
  const theme = PERSONA_THEMES[persona] || PERSONA_THEMES.builder;

  if (!config) {
    throw new Error(`Unknown newsletter persona: ${persona}`);
  }

  return function NewsletterPage() {
    const [emailValue, setEmailValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!emailValue) return;
      setIsSubmitting(true);

      const { subscribeNewsletter } = await import('@/app/actions/public.actions');
      const result = await subscribeNewsletter(emailValue, [persona], persona);

      setIsSubmitting(false);
      if (result.success) {
        setIsSubmitted(true);
        setEmailValue('');
      } else {
        alert(result.error || 'Failed to subscribe');
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: persona === 'builder' ? 5 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          config.motionTransition || { duration: 0.8, ease: 'easeOut' }
        }
        className={`w-full bg-transparent min-h-[70vh] flex flex-col justify-start py-10 md:py-16 ${theme.wrapper} ${['operator', 'wanderer'].includes(persona) ? 'relative z-10' : ''}`}
      >
        <div className="max-w-4xl mx-auto px-5 md:px-12 w-full flex-1 flex flex-col justify-center">
          {/* ── BRAND HEADER ── */}
          <div className="mb-6 md:mb-10">
            <span className={theme.brandName}>{config.newsletterName}</span>
          </div>

          {/* ── HERO ── */}
          <section className="mb-6 md:mb-10">
            <h1 className={`${theme.title} mb-3 md:mb-4`}>
              {config.title}
            </h1>
            <p className={theme.description}>
              {config.description}
            </p>
          </section>

          {/* ── EMAIL FORM ── */}
          <section className="mb-8 md:mb-10 w-full max-w-xl">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={theme.submittedCard}
              >
                <div className={`flex justify-between items-center mb-2 ${theme.submittedLabel}`}>
                  <span>{config.submittedLabel}</span>
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current opacity-50" />
                  </span>
                </div>
                <p className={`${theme.submittedTitle} leading-relaxed mb-1`}>
                  {config.submittedTitle}
                </p>
                <p className={`${theme.submittedDescription} leading-relaxed`}>
                  {config.submittedDescription}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col w-full relative">
                <div className="relative group w-full mb-4">
                  <input
                    type="email"
                    required
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Enter email address"
                    className={theme.input}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 ${theme.submitBtn}`}
                    aria-label="Subscribe"
                  >
                    {isSubmitting ? (
                      <div className={theme.spinner} />
                    ) : (
                      <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                {/* Brand Promise */}
                <div className="flex flex-col gap-1.5 px-1">
                  <div className="hidden md:flex items-center gap-3">
                    <span className={theme.tagline}>Low frequency</span>
                    <span className={`${theme.tagline} opacity-60`}>·</span>
                    <span className={theme.tagline}>High signal</span>
                  </div>
                  <p className={`${theme.footerMetaLabel} text-[10px] sm:text-[11px] leading-relaxed font-light italic normal-case`}>
                    No schedules. No weekly promises. Only sending when there&apos;s something worth sending.
                  </p>
                </div>
              </form>
            )}
          </section>

          {/* ── WHAT YOU'LL RECEIVE ── */}
          <section className={`hidden md:block mb-8 md:mb-10 pt-6 md:pt-8 ${theme.divider}`}>
            <h2 className={`${theme.sectionHeading} mb-3 md:mb-5`}>
              {config.expectationsHeading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 md:gap-y-3.5">
              {config.expectations.map((exp, idx) => (
                <div key={idx} className="flex items-center gap-2 md:gap-3">
                  <span className={`${theme.bullet} hidden md:inline`}>{config.bulletIcon}</span>
                  <span className={theme.expectationText}>{exp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── RECENT LETTERS ── */}
          <section className={`pt-6 md:pt-8 ${theme.divider}`}>
            <h2 className={`${theme.sectionHeading} mb-3 md:mb-5`}>
              {config.recentLettersHeading}
            </h2>
            <div className="space-y-2 md:space-y-3">
              {config.recentLetters.map((letter, idx) => (
                <div
                  key={idx}
                  className={`flex items-baseline justify-between gap-4 py-1.5 md:py-2 ${theme.letterDivider}`}
                >
                  <span className={theme.letterTitle}>{letter.title}</span>
                  <span className={`${theme.letterDate} hidden md:inline`}>{letter.date}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    );
  };
}
