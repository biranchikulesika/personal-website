'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Copy, Check, Search } from 'lucide-react';

import { FooterThinker } from '@/components/footer-thinker';
import { FooterBuilder } from '@/components/footer-builder';
import { FooterWanderer } from '@/components/footer-wanderer';
import { FooterOperator } from '@/components/footer-operator';
import { FooterMain } from '@/components/footer-main';
import { MarkdownRenderer } from '@/components/mdx/MarkdownRenderer';

// Standard HTML element patterns — used to distinguish raw HTML content
// from plain markdown or MDX (which uses component tags like <Image>).
const HTML_TAG_PATTERN = /<(a|abbr|address|article|aside|b|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|dd|del|details|dfn|dialog|div|dl|dt|em|fieldset|figcaption|figure|footer|form|h[1-6]|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|menu|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|picture|portal|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr)\b[\s\S]*?>/i;

// Subtle skeleton shown while MDXRenderer is being dynamically imported on the client.
// Matches the article body's prose spacing to minimize layout shift.
const MDXLoadingSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-4 bg-muted rounded w-full" />
    <div className="h-4 bg-muted rounded w-5/6" />
    <div className="h-4 bg-muted rounded w-4/5" />
    <div className="h-4 bg-muted rounded w-3/4" />
    <div className="h-3" />
    <div className="h-4 bg-muted rounded w-full" />
    <div className="h-4 bg-muted rounded w-full" />
    <div className="h-4 bg-muted rounded w-2/3" />
    <div className="h-5 bg-muted/70 rounded w-1/3 mt-8" />
    <div className="h-4 bg-muted rounded w-full" />
    <div className="h-4 bg-muted rounded w-5/6" />
    <div className="h-4 bg-muted rounded w-11/12" />
    <div className="h-4 bg-muted rounded w-3/5" />
    <div className="h-5 bg-muted/70 rounded w-2/5 mt-8" />
    <div className="border-l-2 border-muted pl-8 space-y-3 py-2">
      <div className="h-4 bg-muted rounded w-4/5" />
      <div className="h-4 bg-muted rounded w-3/5" />
    </div>
    <div className="h-4 bg-muted rounded w-full" />
    <div className="h-4 bg-muted rounded w-4/5" />
  </div>
);

import { ThemeToggle } from '@/components/theme-toggle';
import { PersonaSwitcher } from '@/components/persona-switcher';
import { PersonaSearch } from '@/components/persona-search';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { FieldNoteDivider } from '@/components/field-note-divider';
import { subscribeNewsletter } from '@/app/actions/public.actions';
import { formatDate } from '@/lib/utils';

const getEmojiForLocation = (location: string): string => {
  const loc = location.toLowerCase();
  if (loc.includes('platform') || loc.includes('coast') || loc.includes('beach') || loc.includes('ocean')) return '🌊';
  if (loc.includes('train') || loc.includes('transit') || loc.includes('rail') || loc.includes('carriage') || loc.includes('district') || loc.includes('cuttack')) return '🚃';
  if (loc.includes('bhubaneswar') || loc.includes('study') || loc.includes('lounge') || loc.includes('town') || loc.includes('puri')) return '📍';
  return '📍';
};

const renderTextWithInlineFormatting = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeContent = part.slice(1, -1);
      return (
        <code key={index} className="bg-muted text-primary rounded-[3px] px-1.5 py-0.5 text-[0.85em] font-mono border border-border mx-0.5 font-normal select-text">
          {codeContent}
        </code>
      );
    }
    const subParts = part.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
    return subParts.map((subPart, subIndex) => {
      if (subPart.startsWith('**') && subPart.endsWith('**')) {
        return <strong key={`${index}-${subIndex}`} className="font-semibold">{subPart.slice(2, -2)}</strong>;
      }
      if (subPart.startsWith('*') && subPart.endsWith('*')) {
        return <em key={`${index}-${subIndex}`} className="italic">{subPart.slice(1, -1)}</em>;
      }
      if (subPart.startsWith('[') && subPart.includes('](')) {
        const match = subPart.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [, linkText, url] = match;
          return (
            <a
              key={`${index}-${subIndex}`}
              href={url}
              target={url.startsWith('http') ? '_blank' : undefined}
              rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="underline underline-offset-4 decoration-primary/30 hover:decoration-primary/80 text-primary transition-colors"
            >
              {linkText}
            </a>
          );
        }
      }
      return subPart;
    });
  });
};

export interface PostRendererProps {
  post: any | undefined;
  slug: string;
  allPosts: any[];
  fallbackPersona?: string;
  compiledMdx?: any;
  postOnly?: boolean;
}

export default function PostRenderer({ post, slug, allPosts, fallbackPersona, compiledMdx, postOnly }: PostRendererProps) {
  const [copied, setCopied] = useState(false);
  const [, setScrollPercent] = useState(0);
  const [, setShowToTop] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'latest'>('top');
  const [currentUrl, setCurrentUrl] = useState('');
  const [brokenImages, setBrokenImages] = useState<Record<string, true>>({});

  // DOMPurify is browser-only and can't be statically imported in SSR.
  // Dynamically import it once on mount so it only runs client-side.
  const domPurifyRef = useRef<any>(null);
  const [, forceRerender] = useState(0);

  useEffect(() => {
    import('dompurify').then((mod) => {
      domPurifyRef.current = mod.default;
      forceRerender(n => n + 1);
    });
  }, []);

  // MDXRenderer uses next-mdx-remote which crashes during SSR in Turbopack.
  // We avoid next/dynamic (which causes a bailout to CSR) in favor of a
  // plain useEffect + useState pattern that loads the component on the
  // client side without triggering the SSR bailout mechanism.
  const [MDXRendererClient, setMDXRendererClient] = useState<React.ComponentType<{source: any}> | null>(null);

  useEffect(() => {
    import('@/lib/mdx/renderer').then((mod) => {
      setMDXRendererClient(() => mod.MDXRenderer);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        setCurrentUrl(window.location.href);
      }, 0);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.documentElement;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      if (scrollHeight > 0) {
        const percent = (container.scrollTop / scrollHeight) * 100;
        setScrollPercent(Math.round(percent));
      }
      setShowToTop(container.scrollTop > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailValue.trim()) {
      const targetPersona = p;
      await subscribeNewsletter(emailValue.trim(), [targetPersona], targetPersona);
      setIsSubscribed(true);
      setEmailValue('');
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  const p = post?.persona || fallbackPersona || 'wanderer';

  // Memoize themes object — it's a large static lookup that never changes per render
  const themes = useMemo(() => ({
    "wanderer": {
      "wrapper": `font-sans bg-background text-foreground selection:bg-primary/20 min-h-screen`,
      "headerBg": `bg-background/95 border-b border-border`,
      "themeToggleText": `text-primary font-serif italic`,
      "meta": `font-sans text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary mb-3`,
      "title": `font-serif font-bold leading-[1.12] text-3xl md:text-4.5xl lg:text-5xl tracking-tight text-foreground mb-3`,
      "subtitle": `font-serif font-light italic text-[16px] sm:text-[18px] text-primary/80 leading-relaxed mb-6 pb-4 border-b border-border`,
      "heroBorder": `border-border`,
      "heroBg": `bg-muted`,
      "heroFilter": `filter saturate-[95%] brightness-[92%] dark:brightness-[84%]`,
      "badgeClass": `font-sans text-xs tracking-wide text-foreground bg-muted border border-border`,
      "caption": `text-primary/70 font-sans tracking-wide leading-relaxed text-xs`,
      "paragraph": `font-serif text-[17px] sm:text-[18.2px] leading-[1.78] text-foreground mb-6`,
      "linkHover": `hover:text-primary`,
      "quoteBorder": `border-primary`,
      "quoteText": `font-serif italic text-[1.25rem] sm:text-[1.4rem] text-foreground`,
      "h2": `font-serif font-bold text-2xl md:text-3xl text-foreground mt-10 mb-4`,
      "h3": `font-serif font-bold text-xl md:text-2xl text-foreground mt-8 mb-3`,
      "sidenoteLine": `border-primary/30`,
      "sidenoteText": `font-sans text-[12px] text-primary italic`,
      "codeWrapper": `bg-muted text-foreground border border-border`,
      "codeHeader": `border-border opacity-70`,
      "divider": `text-primary/40 font-mono`,
      "tableHead": `text-primary font-serif italic`,
      "tableBorder": `border-border`,
      "tableRowHover": `hover:bg-muted`,
      "tableCellBorder": `border-border`,
      "shareBorder": `border-border`,
      "shareTitle": `text-primary/70`,
      "shareIcon": `border-border text-primary/70 hover:text-foreground hover:border-primary hover:bg-muted`,
      "shareCheck": `text-primary`,
      "relatedSectionBorder": `border-border`,
      "relatedLabel": `text-primary/70 font-sans tracking-widest font-semibold text-[10px]`,
      "relatedItemBorder": `border-border`,
      "relatedTitleText": `font-serif font-bold text-[15.5px] sm:text-[16px] text-foreground group-hover:text-primary`,
      "relatedDate": `text-primary/70`,
      "newsletterBorder": `border-border`,
      "newsletterLabel": `text-primary`,
      "newsletterDesc": `font-serif italic text-sm text-primary/80`,
      "newsletterMsg": `font-sans text-xs text-foreground bg-muted p-3 rounded border border-border`,
      "newsletterInputLine": `border-border text-foreground focus:border-primary placeholder:text-primary/50 font-sans text-xs`,
      "newsletterSubmit": `text-primary hover:text-foreground font-sans font-bold uppercase text-[10px] tracking-widest`,
      "tabBorder": `border-border`,
      "tabActive": `text-primary bg-muted font-serif italic shadow-sm`,
      "tabInactive": `text-primary/70 hover:text-foreground font-serif italic`,
      "discoveryExcerpt": `font-sans text-xs text-primary/80`,
      "viewAllBorder": `border-border`,
      "viewAllAction": `font-serif italic text-[14px] text-primary hover:underline`,
      "wordingRelatedReflections": `RELATED DISPATCHES`,
      "wordingLetters": `INSIDE THE HEAD DISPATCH`,
      "wordingLettersDesc": `Occasional meditations, essays, and direct inquiries sent straight into your quiet inbox.`,
      "wordingLettersReg": `Subscription recorded. Dispatches will arrive in your quiet moments.`,
      "wordingLettersBtn": `Receive Dispatches`,
      "wordingViewAll": `View Complete Notebook Feed`
    },
    "thinker": {
      "wrapper": `font-sans bg-background text-foreground selection:bg-primary/20 min-h-screen`,
      "headerBg": `bg-background/95 border-b border-border`,
      "themeToggleText": `text-foreground font-sans font-light`,
      "meta": `font-mono text-[9.5px] uppercase tracking-[0.25em] text-primary font-medium mb-2`,
      "title": `font-cormorant font-normal leading-[1.07] text-4xl md:text-5xl lg:text-5xl tracking-tight text-foreground mb-2`,
      "subtitle": `font-spectral font-light italic text-[15.5px] sm:text-[17px] text-primary/80 leading-relaxed mb-6 pb-4 border-b border-border`,
      "heroBorder": `border-border`,
      "heroBg": `bg-muted`,
      "heroFilter": `filter grayscale-[20%] contrast-[90%] sepia-[5%] saturate-[85%] brightness-[95%] dark:brightness-[80%]`,
      "badgeClass": `font-sans tracking-wide text-foreground bg-muted border-border`,
      "caption": `text-primary/70 font-mono tracking-[0.12em]`,
      "paragraph": `font-sans font-light text-[1.1rem] leading-[1.8] text-foreground`,
      "linkHover": `hover:text-primary`,
      "quoteBorder": `border-foreground`,
      "quoteText": `font-spectral italic text-[1.35rem] sm:text-[1.55rem] text-foreground`,
      "h2": `font-cormorant text-2xl md:text-3.5xl text-foreground`,
      "h3": `font-cormorant text-xl md:text-2xl text-foreground`,
      "sidenoteLine": `border-border`,
      "sidenoteText": `font-mono text-[11px] text-primary/80`,
      "codeWrapper": `bg-muted border border-border text-foreground`,
      "codeHeader": `border-border opacity-60`,
      "divider": `text-primary/30 font-mono`,
      "tableHead": `text-foreground font-sans`,
      "tableBorder": `border-border`,
      "tableRowHover": `hover:bg-muted`,
      "tableCellBorder": `border-border`,
      "shareBorder": `border-border`,
      "shareTitle": `text-primary/80`,
      "shareIcon": `border-border text-primary/80 hover:text-foreground hover:border-foreground hover:bg-muted`,
      "shareCheck": `text-primary`,
      "relatedSectionBorder": `border-border`,
      "relatedLabel": `text-primary font-sans`,
      "relatedItemBorder": `border-border`,
      "relatedTitleText": `font-cormorant font-light text-[17px] sm:text-[18.5px] text-foreground group-hover:text-primary`,
      "relatedDate": `text-primary/80`,
      "newsletterBorder": `border-border`,
      "newsletterLabel": `text-primary`,
      "newsletterDesc": `font-spectral italic text-[14px] text-primary/80`,
      "newsletterMsg": `font-mono text-[11px] text-foreground`,
      "newsletterInputLine": `border-border text-foreground focus:border-foreground placeholder:text-primary/60 font-sans`,
      "newsletterSubmit": `text-primary/80 hover:text-foreground font-sans uppercase text-[10px] tracking-widest`,
      "tabBorder": `border-border`,
      "tabActive": `text-foreground bg-muted font-sans text-[13px] shadow-sm`,
      "tabInactive": `text-primary/80 hover:text-foreground font-sans text-[13px]`,
      "discoveryExcerpt": `font-sans font-light text-primary/80`,
      "viewAllBorder": `border-border`,
      "viewAllAction": `font-sans text-[14px] text-foreground hover:text-primary`,
      "wordingRelatedReflections": `FURTHER REFLECTIONS`,
      "wordingLetters": `RECEIVE DISPATCHES`,
      "wordingLettersDesc": `Occasional thoughts from quieter corners, sent straight from the source.`,
      "wordingLettersReg": `You are registered. Dispatches will arrive in your quiet moments.`,
      "wordingLettersBtn": `Join Dispatch`,
      "wordingViewAll": `View All Thoughts`
    },
    "builder": {
      "wrapper": `font-sans bg-background text-foreground selection:bg-muted min-h-screen`,
      "headerBg": `bg-background/95 border-b border-border`,
      "themeToggleText": `text-primary font-mono`,
      "meta": `font-mono text-[9.5px] uppercase tracking-widest text-primary font-medium mb-2`,
      "title": `font-sans font-semibold leading-snug text-3xl md:text-4xl lg:text-4.5xl tracking-tight text-foreground mb-2`,
      "subtitle": `font-mono text-[13px] sm:text-[14px] text-primary/80 leading-relaxed mb-6 pb-4 border-b border-border`,
      "heroBorder": `border-border`,
      "heroBg": `bg-muted`,
      "heroFilter": `filter grayscale-[10%]`,
      "badgeClass": `font-mono tracking-wide text-foreground bg-muted border-border`,
      "caption": `text-primary font-mono tracking-widest`,
      "paragraph": `font-sans font-light text-[1.05rem] leading-[1.8] text-foreground`,
      "linkHover": `hover:text-primary font-medium`,
      "quoteBorder": `border-primary/50`,
      "quoteText": `font-mono text-[13px] text-primary/90`,
      "h2": `font-sans font-semibold text-xl md:text-2xl text-foreground`,
      "h3": `font-sans font-medium text-lg md:text-xl text-foreground`,
      "sidenoteLine": `border-border`,
      "sidenoteText": `font-mono text-[11px] text-primary`,
      "codeWrapper": `bg-muted border border-border text-foreground`,
      "codeHeader": `border-border opacity-60`,
      "divider": `text-border font-mono`,
      "tableHead": `text-foreground font-sans uppercase`,
      "tableBorder": `border-border`,
      "tableRowHover": `hover:bg-muted/50`,
      "tableCellBorder": `border-border`,
      "shareBorder": `border-border`,
      "shareTitle": `text-primary`,
      "shareIcon": `border-border text-primary hover:text-foreground hover:border-foreground hover:bg-muted`,
      "shareCheck": `text-foreground`,
      "relatedSectionBorder": `border-border`,
      "relatedLabel": `text-primary font-mono`,
      "relatedItemBorder": `border-border`,
      "relatedTitleText": `font-sans font-medium text-[15px] sm:text-[16px] text-foreground group-hover:opacity-80`,
      "relatedDate": `text-primary`,
      "newsletterBorder": `border-border`,
      "newsletterLabel": `text-primary font-mono`,
      "newsletterDesc": `font-mono text-[12px] text-primary/80`,
      "newsletterMsg": `font-mono text-[11px] text-foreground`,
      "newsletterInputLine": `border-border text-foreground focus:border-primary placeholder:text-primary/60 font-mono text-[11px]`,
      "newsletterSubmit": `text-primary hover:text-foreground font-mono uppercase tracking-widest text-[10px]`,
      "tabBorder": `border-border`,
      "tabActive": `text-foreground bg-muted font-sans text-xs shadow-sm`,
      "tabInactive": `text-primary hover:text-foreground font-sans text-xs`,
      "discoveryExcerpt": `font-mono text-[12px] text-primary`,
      "viewAllBorder": `border-border`,
      "viewAllAction": `font-sans font-medium text-[13px] text-foreground hover:opacity-85`,
      "wordingRelatedReflections": `RELATED BUILDS`,
      "wordingLetters": `BUILD DISPATCH`,
      "wordingLettersDesc": `System engineering drafts and project summaries.`,
      "wordingLettersReg": `You are registered. Dispatches will arrive shortly.`,
      "wordingLettersBtn": `Join Dispatch`,
      "wordingViewAll": `View All Builds`
    },
    "operator": {
      "wrapper": `font-mono bg-background text-foreground selection:bg-muted min-h-screen`,
      "headerBg": `bg-background/95 border-b border-border`,
      "themeToggleText": `text-primary font-mono`,
      "meta": `font-mono text-[10px] uppercase tracking-widest text-primary font-bold mb-2`,
      "title": `font-mono font-bold uppercase leading-tight text-xl md:text-2xl lg:text-3xl tracking-tight text-foreground mb-2`,
      "subtitle": `font-mono text-[12px] text-primary/80 leading-relaxed mb-6 pb-4 border-b border-border`,
      "heroBorder": `border-border`,
      "heroBg": `bg-muted`,
      "heroFilter": `filter grayscale-[50%] contrast-[120%]`,
      "badgeClass": `font-mono tracking-widest text-foreground bg-muted border-border`,
      "caption": `text-primary font-mono tracking-widest`,
      "paragraph": `font-mono text-[13px] leading-[1.8] text-foreground tracking-wide`,
      "linkHover": `hover:opacity-75 underline`,
      "quoteBorder": `border-border`,
      "quoteText": `font-mono text-xs text-primary/80`,
      "h2": `font-mono font-bold text-sm tracking-wider text-foreground uppercase mt-[3.0rem] mb-[1.0rem] pt-1`,
      "h3": `font-mono font-bold text-[13px] tracking-wider text-foreground uppercase mt-[2.0rem] mb-[0.75rem]`,
      "sidenoteLine": `border-border`,
      "sidenoteText": `font-mono text-[10px] text-primary/80`,
      "codeWrapper": `bg-muted/40 border border-dashed border-border text-primary/90`,
      "codeHeader": `border-dashed border-border opacity-60`,
      "divider": `text-border font-mono tracking-[0.5em]`,
      "tableHead": `text-foreground font-mono`,
      "tableBorder": `border-dashed border-border`,
      "tableRowHover": `hover:bg-muted/20`,
      "tableCellBorder": `border-dashed border-border`,
      "shareBorder": `border-dashed border-border`,
      "shareTitle": `text-primary`,
      "shareIcon": `rounded-[none] border border-border text-primary hover:text-foreground hover:bg-muted/40`,
      "shareCheck": `text-foreground`,
      "relatedSectionBorder": `border-border`,
      "relatedLabel": `text-primary font-mono`,
      "relatedItemBorder": `border-border`,
      "relatedTitleText": `font-mono text-[13px] text-primary group-hover:text-foreground uppercase`,
      "relatedDate": `text-primary/80`,
      "newsletterBorder": `border-border`,
      "newsletterLabel": `text-primary`,
      "newsletterDesc": `font-mono text-[11px] text-primary/80`,
      "newsletterMsg": `font-mono text-[10px] text-foreground p-2 border border-dashed border-border`,
      "newsletterInputLine": `border-border text-foreground focus:outline-none placeholder:text-primary/60 font-mono text-[10px] italic`,
      "newsletterSubmit": `text-primary hover:text-foreground font-mono tracking-widest text-[9px] uppercase`,
      "tabBorder": `border border-dashed border-border rounded-[none]`,
      "tabActive": `text-foreground bg-muted font-mono text-[11px] rounded-[none]`,
      "tabInactive": `text-primary hover:text-foreground font-mono text-[11px] rounded-[none]`,
      "discoveryExcerpt": `font-mono text-[11px] text-primary/80`,
      "viewAllBorder": `border-border`,
      "viewAllAction": `font-mono text-[12px] text-primary hover:text-foreground`,
      "wordingRelatedReflections": `RELATED SIGNALS`,
      "wordingLetters": `DISPATCH CHANNEL`,
      "wordingLettersDesc": `Occasional signals. Operational notes. Infrastructure observations.`,
      "wordingLettersReg": `SYS_DISPATCH: REGISTERED_SUCCESSFULLY`,
      "wordingLettersBtn": `[SUB]`,
      "wordingViewAll": `View All Signals`
    },
    "main": {
      "wrapper": `font-sans bg-background text-foreground selection:bg-primary/20 min-h-screen`,
      "headerBg": `bg-background/95 border-b border-border`,
      "themeToggleText": `text-primary font-serif italic`,
      "meta": `font-sans text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary mb-3`,
      "title": `font-sans font-bold leading-[1.12] text-3xl md:text-4.5xl lg:text-5xl tracking-tight text-foreground mb-3`,
      "subtitle": `font-serif font-light italic text-[16px] sm:text-[18px] text-primary/80 leading-relaxed mb-6 pb-4 border-b border-border`,
      "heroBorder": `border-border`,
      "heroBg": `bg-muted`,
      "heroFilter": `filter saturate-[95%] brightness-[92%] dark:brightness-[84%]`,
      "badgeClass": `font-sans text-xs tracking-wide text-foreground bg-muted border border-border`,
      "caption": `text-primary/70 font-sans tracking-wide leading-relaxed text-xs`,
      "paragraph": `font-serif text-[17px] sm:text-[18.2px] leading-[1.78] text-foreground mb-6`,
      "linkHover": `hover:text-primary`,
      "quoteBorder": `border-primary`,
      "quoteText": `font-serif italic text-[1.25rem] sm:text-[1.4rem] text-foreground`,
      "h2": `font-serif font-bold text-2xl md:text-3xl text-foreground mt-10 mb-4`,
      "h3": `font-serif font-bold text-xl md:text-2xl text-foreground mt-8 mb-3`,
      "sidenoteLine": `border-primary/30`,
      "sidenoteText": `font-sans text-[12px] text-primary italic`,
      "codeWrapper": `bg-muted text-foreground border border-border`,
      "codeHeader": `border-border opacity-70`,
      "divider": `text-primary/40 font-mono`,
      "tableHead": `text-primary font-serif italic`,
      "tableBorder": `border-border`,
      "tableRowHover": `hover:bg-muted`,
      "tableCellBorder": `border-border`,
      "shareBorder": `border-border`,
      "shareTitle": `text-primary/70`,
      "shareIcon": `border-border text-primary/70 hover:text-foreground hover:border-primary hover:bg-muted`,
      "shareCheck": `text-primary`,
      "relatedSectionBorder": `border-border`,
      "relatedLabel": `text-primary/70 font-sans tracking-widest font-semibold text-[10px]`,
      "relatedItemBorder": `border-border`,
      "relatedTitleText": `font-serif font-bold text-[15.5px] sm:text-[16px] text-foreground group-hover:text-primary`,
      "relatedDate": `text-primary/70`,
      "newsletterBorder": `border-border`,
      "newsletterLabel": `text-primary`,
      "newsletterDesc": `font-serif italic text-sm text-primary/80`,
      "newsletterMsg": `font-sans text-xs text-foreground bg-muted p-3 rounded border border-border`,
      "newsletterInputLine": `border-border text-foreground focus:border-primary placeholder:text-primary/50 font-sans text-xs`,
      "newsletterSubmit": `text-primary hover:text-foreground font-sans font-bold uppercase text-[10px] tracking-widest`,
      "tabBorder": `border-border`,
      "tabActive": `text-primary bg-muted font-serif italic shadow-sm`,
      "tabInactive": `text-primary/70 hover:text-foreground font-serif italic`,
      "discoveryExcerpt": `font-sans text-xs text-primary/80`,
      "viewAllBorder": `border-border`,
      "viewAllAction": `font-serif italic text-[14px] text-primary hover:underline`,
      "wordingRelatedReflections": `RELATED DISPATCHES`,
      "wordingLetters": `INSIDE THE HEAD DISPATCH`,
      "wordingLettersDesc": `Occasional meditations, essays, and direct inquiries sent straight into your quiet inbox.`,
      "wordingLettersReg": `Subscription recorded. Dispatches will arrive in your quiet moments.`,
      "wordingLettersBtn": `Receive Dispatches`,
      "wordingViewAll": `View Complete Notebook Feed`
    }
  }), []);

  const theme = themes[p as keyof typeof themes] || themes.wanderer;

  const [notFoundSearchQuery, setNotFoundSearchQuery] = useState('');
  const [notFoundResults, setNotFoundResults] = useState<any[] | null>(null);

  const handleNotFoundSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!notFoundSearchQuery.trim()) {
      setNotFoundResults(null);
      return;
    }
    const targetPersona = p === 'main' ? undefined : p;
    const q = notFoundSearchQuery.toLowerCase();
    const results = allPosts.filter(item => {
      if (targetPersona && item.persona !== targetPersona) return false;
      return item.title?.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q);
    });
    setNotFoundResults(results);
  }, [notFoundSearchQuery, allPosts, p]);

  // Memoize post filtering and sorting — these operate on potentially large arrays
  const personaPosts = useMemo(() => 
    (allPosts || []).filter((x: any) => x.persona === p && !x.hidden),
    [allPosts, p]
  );

  const latestPosts = useMemo(() => 
    [...personaPosts].sort((a: any, b: any) => 
      new Date(b.date || b.publishedAt || b.createdAt).getTime() - new Date(a.date || a.publishedAt || a.createdAt).getTime()
    ),
    [personaPosts]
  );

  const topSlugsMap: Record<string, string[]> = useMemo(() => ({
    thinker: ['attention-vs-connection', 'solitude-vs-isolation', 'moral-clarity'],
    builder: ['designing-systems-that-feel-human', 'systems-fail-slowly', 'developer-portfolios-artificial'],
    operator: ['operational-silence-stability', 'convenience-first-attack-surface', 'systems-fail-slowly'],
    wanderer: ['temporary-places-comfort', 'conversations-that-stayed-longer', 'certain-places-familiar', 'evening-train-ride', 'rainy-train-ride-notes']
  }), []);

  const topPosts = useMemo(() => {
    const order = topSlugsMap[p] || [];
    return [...personaPosts].sort((a, b) => {
      const idxA = order.indexOf(a.slug);
      const idxB = order.indexOf(b.slug);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [personaPosts, p, topSlugsMap]);

  const otherPosts = useMemo(() => 
    personaPosts.filter((x: any) => x.slug !== slug),
    [personaPosts, slug]
  );

  const relatedPostsList = useMemo(() => {
    const uniqueRelatedTitles = new Set();
    const list: { title: string; slug: string; date: string }[] = [];
    otherPosts.forEach((postItem: any) => {
      if (!uniqueRelatedTitles.has(postItem.title) && postItem.title !== post?.title) {
        uniqueRelatedTitles.add(postItem.title);
        list.push({
          title: postItem.title,
          slug: postItem.slug,
          date: postItem.publishedAt 
            ? formatDate(postItem.publishedAt) 
            : postItem.date || 'Unknown Date'
        });
      }
    });
    return list;
  }, [otherPosts, post?.title]);

  const renderRelatedReflections = () => (
    <div className={"space-y-3 " + (p === 'operator' ? 'font-mono' : p === 'thinker' ? 'font-sans' : 'font-spectral')}>
      <span className={"text-[10px] uppercase tracking-[0.25em] font-semibold block " + theme.relatedLabel}>
        {theme.wordingRelatedReflections}
      </span>
      <div className="flex flex-col space-y-3">
        {relatedPostsList.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            className={"border-b pb-3 last:border-0 last:pb-0 " + theme.relatedItemBorder}
          >
            <Link
              href={`/p/${item.slug}`}
              className="group block"
            >
              <h5 className={`transition-colors leading-snug ${theme.relatedTitleText}`}>
                {item.title}
              </h5>
              <span className={"font-mono text-[9px] uppercase tracking-wider block mt-1 " + theme.relatedDate}>
                {item.date}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNewsletter = (withTopDivider = true) => (
    <div className={`space-y-4 ${withTopDivider ? 'border-t pt-6 ' + theme.newsletterBorder : ''}`}>
      <span className={"text-[10px] uppercase tracking-[0.25em] font-semibold block " + theme.newsletterLabel}>
        {theme.wordingLetters}
      </span>
      <p className={"leading-relaxed " + theme.newsletterDesc}>
        {theme.wordingLettersDesc}
      </p>

      {isSubscribed ? (
        <div className={"py-2 " + theme.newsletterMsg}>
          {theme.wordingLettersReg}
        </div>
      ) : (
        <form onSubmit={handleSubscribeSubmit} className="flex flex-col gap-3.5 max-w-xs pt-0.5">
          <input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder={p === 'operator' ? "SYS_USER_EMAIL=(...)" : "Your email address"}
            className={"bg-transparent border-b py-1 focus:outline-none transition-colors " + theme.newsletterInputLine}
            required
          />
          <button
            type="submit"
            className={"transition-colors cursor-pointer text-left py-1 w-fit " + theme.newsletterSubmit}
          >
            {theme.wordingLettersBtn}
          </button>
        </form>
      )}
    </div>
  );

  const displayDate = post?.date || (post?.publishedAt ? formatDate(post.publishedAt) : 'Unknown Date');

  const renderArticleHeader = () => (
    <>
      <div className={"mb-2 select-none " + theme.meta}>
        {p.toUpperCase()} • {displayDate.toUpperCase()} • {String(post?.readingTime || '').toUpperCase()} {typeof post?.readingTime === 'number' ? 'MIN READ' : ''}
      </div>

      <h1 className={theme.title}>
        {post?.title}
      </h1>

      <div className={theme.subtitle}>
        {post?.subtitle}
      </div>

      {post?.byline && (
        <div className="text-xs font-mono text-primary/60 mb-6 font-medium tracking-wide uppercase select-none pb-2 border-b border-border">
          {post?.byline}
        </div>
      )}

      {(!brokenImages['hero'] && post?.heroImage) && (
        <div className="my-10 block w-full relative">
          <div className={`relative overflow-hidden w-full border ${theme.heroBg} ${theme.heroBorder}`} style={{ aspectRatio: '16/10' }}>
            <Image
              src={post?.heroImage}
              alt={post?.title || ''}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              className={`object-cover ${theme.heroFilter}`}
              referrerPolicy="no-referrer"
              onError={() => setBrokenImages(prev => ({ ...prev, hero: true }))}
            />
            {post?.location && (
              <div className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 text-[10.5px] backdrop-blur-[6px] rounded-full select-none ${theme.badgeClass}`}>
                <span>{getEmojiForLocation(post.location)}</span>
                <span>{post.location}</span>
              </div>
            )}
          </div>
          {post?.heroCaption && (
            <div className={"mt-2.5 text-center text-[11px] uppercase max-w-[80%] mx-auto opacity-55 leading-relaxed select-none " + theme.caption}>
              {post.heroCaption}
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderArticleBody = () => {
    if (compiledMdx && MDXRendererClient) {
      return (
        <article
          className={`leading-[1.8] outline-none max-w-none ${
            p === 'builder' ? 'prose prose-invert prose-neutral text-foreground font-sans' :
            p === 'operator' ? 'prose-emerald text-foreground font-mono' :
            p === 'thinker' ? 'prose-stone text-foreground font-serif' :
            'prose-stone text-foreground font-serif'
          }`}
        >
          <MDXRendererClient source={compiledMdx} />
        </article>
      );
    }

    // Show loading skeleton while MDX renderer is being imported on the client
    if (compiledMdx && !MDXRendererClient) {
      return (
        <article
          className={`leading-[1.8] outline-none max-w-none ${
            p === 'builder' ? 'prose prose-invert prose-neutral text-foreground font-sans' :
            p === 'operator' ? 'prose-emerald text-foreground font-mono' :
            p === 'thinker' ? 'prose-stone text-foreground font-serif' :
            'prose-stone text-foreground font-serif'
          }`}
        >
          <MDXLoadingSkeleton />
        </article>
      );
    }

    let parsedContent = post?.content;
    if (typeof post?.content === 'string') {
      try {
        const maybeJson = JSON.parse(post.content);
        if (Array.isArray(maybeJson)) {
          parsedContent = maybeJson;
        }
      } catch (e) {
        // Not JSON, fallback to string
      }
    }

    if (typeof parsedContent === 'string') {
      const isHtmlContent = HTML_TAG_PATTERN.test(parsedContent as string);

      return (
        <article
          className={`leading-[1.8] outline-none max-w-none ${
            isHtmlContent ? 'tiptap-content ' : ''
          }{
            p === 'builder' ? 'prose prose-invert prose-neutral text-foreground font-sans' :
            p === 'operator' ? 'prose-emerald text-foreground font-mono' :
            p === 'thinker' ? 'prose-stone text-foreground font-serif' :
            'prose-stone text-foreground font-serif'
          }`}
        >
          {isHtmlContent ? (
            <div dangerouslySetInnerHTML={{ __html: domPurifyRef.current?.sanitize?.(parsedContent as string) || parsedContent as string }} />
          ) : (
            <MarkdownRenderer content={parsedContent} />
          )}
        </article>
      );
    }

    return (
      <article className="space-y-0">
        {(parsedContent as any[]).map((block, idx) => {
          // Normalize composerBlocks format to expected rendering format
          const textContent = block.text || block.content || '';

          if (block.type === 'paragraph' || block.type === 'text') {
            return (
              <p
                key={idx}
                className={`mb-6 last:mb-0 [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors ${theme.paragraph} ${theme.linkHover}`}
              >
                {renderTextWithInlineFormatting(textContent)}
              </p>
            );
          }

          if (block.type === 'blockquote' || block.type === 'quote') {
            return (
              <blockquote
                key={idx}
                className={`border-l-2 pl-8 mt-6 mb-6 md:mt-8 md:mb-8 py-1 leading-relaxed ${theme.quoteBorder} ${theme.quoteText}`}
              >
                &quot;{renderTextWithInlineFormatting(textContent)}&quot;
              </blockquote>
            );
          }

          if (block.type === 'heading') {
            if (block.level === 3) {
              return (
                <h3 key={idx} className={theme.h3}>{textContent}</h3>
              );
            }
            return (
              <h2 key={idx} className={theme.h2}>{textContent}</h2>
            );
          }

          if (block.type === 'h2') {
            return (
              <h2 key={idx} className={theme.h2}>{textContent}</h2>
            );
          }

          if (block.type === 'h3') {
            return (
              <h3 key={idx} className={theme.h3}>{textContent}</h3>
            );
          }

          if (block.type === 'sidenote' || block.type === 'callout') {
            return (
              <div key={idx} className="my-8 space-y-3">
                <p className={`[&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors ${theme.paragraph} ${theme.linkHover}`}>
                  {renderTextWithInlineFormatting(textContent)}
                </p>
                <div className={`pl-5 border-l leading-relaxed py-0.5 select-none ${theme.sidenoteLine} ${theme.sidenoteText}`}>
                  {block.sidenoteText || 'Note'}
                </div>
              </div>
            );
          }

          if (block.type === 'code') {
            return (
              <div key={idx} className={`my-8 ${p === 'operator'?'rounded-none':'rounded-lg'} font-mono overflow-hidden ${theme.codeWrapper}`}>
                <div className={`flex justify-between items-center px-6 py-2.5 border-b font-mono text-[10px] uppercase tracking-wider ${theme.codeHeader}`}>
                  <span>{block.codeLang || 'source'}</span>
                </div>
                <pre className="p-6 overflow-x-auto text-[12.5px] leading-relaxed max-md:text-[11.5px] select-text">
                  <code>{textContent}</code>
                </pre>
              </div>
            );
          }

          if (block.type === 'image') {
            return (
              <div key={idx} className="my-10 block w-full relative">
                <div className={`relative overflow-hidden w-full border ${theme.heroBg} ${theme.heroBorder}`} style={{ aspectRatio: '16/10' }}>
                  <Image
                    src={block.url || block.src}
                    alt={block.alt || block.caption || ''}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className={`object-cover ${theme.heroFilter}`}
                    referrerPolicy="no-referrer"
                  />
                  {block.location && (
                    <div className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 text-[10.5px] backdrop-blur-[6px] rounded-full select-none ${theme.badgeClass}`}>
                      <span>{getEmojiForLocation(block.location)}</span>
                      <span>{block.location}</span>
                    </div>
                  )}
                </div>
                {block.caption && (
                  <div className={"mt-2.5 text-center text-[11px] uppercase max-w-[80%] mx-auto opacity-55 leading-relaxed select-none " + theme.caption}>
                    {block.caption}
                  </div>
                )}
              </div>
            );
          }

          if (block.type === 'fragment' || block.text === '---' || block.text === '***') {
            return (
              <div key={idx} className={`my-8 flex justify-center select-none tracking-[0.5em] ${theme.divider}`}>
                •••
              </div>
            );
          }

          if (block.type === 'list' || block.type === 'ul') {
            const listItems = block.items || [block.text];
            return (
              <ul key={idx} className={`list-disc pl-6 space-y-[0.8rem] mb-6 ${theme.paragraph}`}>
                {listItems.map((itemValue, i) => (
                  <li key={i}>{renderTextWithInlineFormatting(itemValue)}</li>
                ))}
              </ul>
            );
          }

          if (block.type === 'table') {
            const rows = block.rows || [];
            const headers = block.headers || [];
            const caption = block.caption || '';
            return (
              <div key={idx} className="my-10 overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-[16px] md:text-[18px]">
                  {caption && (
                    <caption className="text-[11px] font-mono text-primary/60 tracking-wider uppercase mb-3 text-left select-none">
                      {caption}
                    </caption>
                  )}
                  {headers.length > 0 && (
                    <thead>
                      <tr className={"border-b " + theme.tableBorder}>
                        {headers.map((h, i) => (
                          <th key={i} className={"py-3 px-4 font-normal uppercase text-xs tracking-widest " + theme.tableHead}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className={`border-b last:border-0 transition-colors ${theme.tableCellBorder} ${theme.tableRowHover}`}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-3 px-4 font-light">{renderTextWithInlineFormatting(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return null;
        })}
      </article>
    );
  };

  const renderContextMarker = () => {
    if (!post?.location) return null;

    let type = 'observed-at';
    let value = post.location;

    if (post.slug === 'evening-train-ride') {
      type = 'transit';
      value = 'District 8 → Central Terminal';
    } else if (post.slug === 'conversations-that-stayed-longer') {
      type = 'observed-at';
      value = 'Coastal Platform 2';
    } else if (post.slug === 'certain-places-familiar') {
      type = 'written-from';
      value = 'Old Town Study';
    } else if (post.slug === 'rainy-train-ride-notes') {
      type = 'field-note';
      value = 'Central Transit Line';
    } else if (post.slug === 'temporary-places-comfort') {
      type = 'custom';
      value = 'Terminal Lounge';
    }

    return <FieldNoteDivider type={type as any} value={value} />;
  };

  const renderShareSection = () => (
    <div className="mt-4 mb-8 pb-8 border-b border-border text-center space-y-4">
      <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 block">
        Share this reflection
      </span>
      <div className="flex flex-row justify-center items-center gap-4 flex-nowrap whitespace-nowrap">
        <a
          href={`https://twitter.com/intent/tweet?url=${currentUrl ? encodeURIComponent(currentUrl) : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300 ${theme.shareIcon}`}
          title="Share on Twitter"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        </a>

        <a
          href={`https://www.linkedin.com/shareArticle?url=${currentUrl ? encodeURIComponent(currentUrl) : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300 ${theme.shareIcon}`}
          title="Share on LinkedIn"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        </a>

        <a
          href={`https://api.whatsapp.com/send?text=${currentUrl ? encodeURIComponent(currentUrl) : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300 ${theme.shareIcon}`}
          title="Share on WhatsApp"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </a>

        <button
          onClick={handleCopyLink}
          className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300 cursor-pointer ${theme.shareIcon}`}
          title={copied ? "Copied!" : "Copy Link"}
        >
          {copied ? <Check className={`w-4.5 h-4.5 ${theme.shareCheck}`} /> : <Copy className="w-4.5 h-4.5" />}
        </button>
      </div>
    </div>
  );

  const renderDiscoveryDesktop = () => (
    <div className="mt-16 w-full flex flex-col">
      <div className="flex mb-8">
        <div className={"inline-flex p-0.75 bg-transparent " + (p === 'operator' ? '' : 'rounded-full border ') + theme.tabBorder}>
          <button
            onClick={() => setActiveTab('top')}
            className={`px-4 py-1.5 cursor-pointer transition-all ${p === 'operator' ? '' : 'rounded-full '} ${
              activeTab === 'top' ? theme.tabActive : theme.tabInactive
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-4 py-1.5 cursor-pointer transition-all ${p === 'operator' ? '' : 'rounded-full '} ${
              activeTab === 'latest' ? theme.tabActive : theme.tabInactive
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {(activeTab === 'top' ? topPosts : latestPosts).slice(0, 3).map((item) => (
          <Link
            key={item.slug}
            href={`/p/${item.slug}`}
            className={"group block border-b py-8 first:pt-2 last:pb-0 last:border-0 " + theme.relatedItemBorder}
          >
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 min-w-0">
                <h4 className={"transition-colors leading-snug " + theme.relatedTitleText}>
                  {item.title}
                </h4>
                <p className={"mt-2 leading-relaxed line-clamp-1 " + theme.discoveryExcerpt}>
                  {item.excerpt}
                </p>
                <span className={"font-mono text-[9px] uppercase tracking-wider block mt-3 " + theme.relatedDate}>
                  {item.date}
                </span>
              </div>
              {(!brokenImages[item.slug] && item.heroImage) && (
                <div className={"w-24 sm:w-28 aspect-4/3 shrink-0 overflow-hidden select-none border " + theme.heroBg + " " + theme.heroBorder + (p==='operator'?' rounded-none':'')}>
                  <Image
                    src={item.heroImage}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    className={`object-cover group-hover:scale-105 transition-transform duration-500 ${theme.heroFilter}`}
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages(prev => ({ ...prev, [item.slug]: true }))}
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className={"pt-6 border-t mt-8 " + theme.viewAllBorder}>
        <Link
          href={`/${p}`}
          className={"inline-flex items-center gap-1 transition-all " + theme.viewAllAction}
        >
          {theme.wordingViewAll} <span className="font-sans">→</span>
        </Link>
      </div>
    </div>
  );

  const renderDiscoveryMobile = () => (
    <>
      <div className="flex mb-6">
        <div className={"inline-flex p-0.75 bg-transparent " + (p === 'operator' ? '' : 'rounded-full border ') + theme.tabBorder}>
          <button
            onClick={() => setActiveTab('top')}
            className={`px-4 py-1.5 cursor-pointer transition-all ${p === 'operator' ? '' : 'rounded-full '} ${
              activeTab === 'top' ? theme.tabActive + ' shadow-sm' : theme.tabInactive
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-4 py-1.5 cursor-pointer transition-all ${p === 'operator' ? '' : 'rounded-full '} ${
              activeTab === 'latest' ? theme.tabActive + ' shadow-sm' : theme.tabInactive
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {(activeTab === 'top' ? topPosts : latestPosts).slice(0, 3).map((item) => (
          <Link
            key={item.slug}
            href={`/p/${item.slug}`}
            className={"group block border-b py-8 first:pt-1 last:pb-0 last:border-0 " + theme.relatedItemBorder}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h4 className={"transition-colors leading-snug " + theme.relatedTitleText}>
                  {item.title}
                </h4>
                <p className={"mt-1.5 leading-relaxed line-clamp-1 " + theme.discoveryExcerpt}>
                  {item.excerpt}
                </p>
                <span className={"font-mono text-[9px] uppercase tracking-wider block mt-2 " + theme.relatedDate}>
                  {item.date}
                </span>
              </div>
              {(!brokenImages['m-' + item.slug] && item.heroImage) && (
                <div className={"w-20 aspect-4/3 shrink-0 overflow-hidden select-none border " + theme.heroBg + " " + theme.heroBorder + (p==='operator'?' rounded-none':'')}>
                  <Image
                    src={item.heroImage}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className={`object-cover group-hover:scale-105 transition-transform duration-500 ${theme.heroFilter}`}
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages(prev => ({ ...prev, ['m-' + item.slug]: true }))}
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className={"pt-6 border-t mt-6 mb-12 " + theme.viewAllBorder}>
        <Link
          href={`/${p}`}
          className={"inline-flex items-center gap-1 transition-all " + theme.viewAllAction}
        >
          {theme.wordingViewAll} <span className="font-sans">→</span>
        </Link>
      </div>
    </>
  );

  const CurrentFooter = { thinker: FooterThinker, builder: FooterBuilder, operator: FooterOperator, wanderer: FooterWanderer, main: FooterMain }[p] || FooterMain;
  const personaCapitalized = p.charAt(0).toUpperCase() + p.slice(1);
  const mobileNavBg = "bg-background";

  if (postOnly) {
    return (
      <div className={`w-full h-full overflow-y-auto ${theme.wrapper} p-6`}>
        <article className="flex w-full max-w-3xl mx-auto flex-col">
          {renderArticleHeader()}
          {renderArticleBody()}
          {renderContextMarker()}
          {renderShareSection()}
        </article>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`min-h-screen flex flex-col relative w-full overflow-x-clip ${theme.wrapper}`}
    >
      <header className={`sticky top-0 z-40 w-full p-4 md:p-6 flex justify-between items-center bg-opacity-70 backdrop-blur-md border-b ${theme.headerBg}`}>
        <PersonaSwitcher currentPersona={personaCapitalized} currentStyle={theme.themeToggleText} />
        <div className="flex items-center gap-1 md:gap-2">
          <DesktopNav persona={p as any} />
          <PersonaSearch persona={personaCapitalized} mobileBgColor={mobileNavBg} />
          <ThemeToggle />
          <MobileNav persona={p as any} mobileBgColor={mobileNavBg} />
        </div>
      </header>

      <main className="flex-1 w-full px-5 sm:px-8 md:px-12 lg:px-16 pt-8 md:pt-10 pb-20 relative z-10">
        <div className="max-w-262.5 mx-auto w-full">

          {!post ? (
            <div className="py-24 md:py-32 flex items-center justify-center">
              <div className="w-full max-w-2xl text-center space-y-6">
                <h1 className={theme.title}>post not found</h1>
                <div className={`space-y-2 opacity-80 ${theme.paragraph}`}>
                  {p === 'builder' && (
                    <>
                      <p>The requested build log could not be located in the current schematic.</p>
                      <p>We are missing the cornerstone for this specific structure.</p>
                      <p>Please review the architecture and verify the building blocks.</p>
                    </>
                  )}
                  {p === 'operator' && (
                    <>
                      <p>Exception: Signal not found. Command path execution failure.</p>
                      <p>The target signal directory is missing or inaccessible.</p>
                      <p>Please re-initialize terminal sequence.</p>
                    </>
                  )}
                  {p === 'thinker' && (
                    <>
                      <p>This thought remains unmapped, resting quietly in the margins.</p>
                      <p>A missing page from the ledger of ideas.</p>
                      <p>Perhaps it is an unspoken premise waiting to be discovered.</p>
                    </>
                  )}
                  {p === 'wanderer' && (
                    <>
                      <p>You have stepped past the edge of the map.</p>
                      <p>This story hasn&apos;t been written yet, a sudden fork in the road.</p>
                      <p>Take a breath and find your bearings.</p>
                    </>
                  )}
                  {p === 'main' && (
                    <>
                      <p>The requested document could not be located in the ecosystem.</p>
                      <p>It may have been moved, archived, or never existed.</p>
                      <p>Please use the search to find what you are looking for.</p>
                    </>
                  )}
                </div>

                <div className="pt-6 max-w-md mx-auto">
                  <form onSubmit={handleNotFoundSearch} className="flex flex-col gap-3 relative">
                    <div className={`relative flex items-center border-b ${theme.heroBorder}`}>
                      <input
                        type="text"
                        value={notFoundSearchQuery}
                        onChange={(e) => setNotFoundSearchQuery(e.target.value)}
                        placeholder={p === 'builder' ? 'Search builds...' : p === 'operator' ? 'Search signals...' : p === 'thinker' ? 'Search reflections...' : p === 'wanderer' ? 'Search stories...' : 'Search posts...'}
                        className={`w-full bg-transparent border-none outline-none py-2 px-1 transition-colors ${theme.themeToggleText}`}
                      />
                      <button type="submit" className={`absolute right-1 p-1 opacity-70 hover:opacity-100 transition-opacity ${theme.themeToggleText}`}>
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                  {notFoundResults !== null && (
                    <div className="mt-6 text-left space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                      {notFoundResults.length > 0 ? notFoundResults.map((r, i) => (
                        <Link key={i} href={`/p/${r.slug}`} className={`block group`}>
                          <h4 className={`font-medium group-hover:opacity-70 transition-opacity ${theme.relatedTitleText}`}>{r.title}</h4>
                          <p className={`text-xs mt-1 ${theme.relatedDate}`}>{formatDate(r.publishedAt || r.date || r.createdAt)}</p>
                        </Link>
                      )) : (
                        <p className={`text-sm italic opacity-60 ${theme.paragraph}`}>No posts found matching your query.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/" className={"inline-block px-6 py-2 transition-colors border " + theme.badgeClass}>
                    return to {p === 'builder' ? 'workbench' : p === 'operator' ? 'console' : p === 'thinker' ? 'index' : p === 'wanderer' ? 'camp' : 'ecosystem'}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden lg:grid grid-cols-10 gap-16 w-full items-start">
                <article className="col-span-6 flex flex-col w-full">
                  {renderArticleHeader()}
                  {renderArticleBody()}
                  {renderContextMarker()}
                  {renderShareSection()}
                  {renderDiscoveryDesktop()}
                </article>

                <div className="col-span-4 pl-4 sticky top-24 h-[calc(100vh-6rem)] flex flex-col justify-center self-start">
                  <div className="space-y-12 w-full">
                    {renderRelatedReflections()}
                    {renderNewsletter(true)}
                  </div>
                </div>
              </div>

              <article className="flex lg:hidden w-full max-w-162.5 mx-auto flex-col">
                {renderArticleHeader()}
                {renderArticleBody()}
                {renderContextMarker()}
                {renderShareSection()}

                <div className={`mb-6 pb-6 border-b ${theme.relatedSectionBorder}`}>
                  {renderRelatedReflections()}
                </div>

                <div className={`mb-6 pb-6 border-b ${theme.relatedSectionBorder}`}>
                  {renderNewsletter(false)}
                </div>

                {renderDiscoveryMobile()}
              </article>
            </>
          )}

        </div>
      </main>

      <CurrentFooter />
    </motion.div>
  );
}
