'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { PersonaSearch } from '@/components/persona-search';
import { ArrowRight, Check } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import { getNewsletterProfiles } from '@/lib/queries';
import { getNewsletterIssues } from '@/lib/queries';
import { subscribeNewsletter } from '@/app/public.actions';
import { getPersonaUrl } from '@/lib/utils';
import { SOCIAL_LINKS } from '@/lib/config/socials';
import { Logo } from '@/components/ui/logo';

interface NewsletterOption {
  id: string;
  persona: string;
  name: string;
  desc: string;
  colorClass: string;
  borderColorClass: string;
  selectedColorClass: string;
}

export default function MainNewsletterPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['thinker', 'wanderer']);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [newsletters, setNewsletters] = useState<NewsletterOption[]>([]);
  const [recentLetters, setRecentLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profiles, issues] = await Promise.all([
          getNewsletterProfiles(),
          getNewsletterIssues()
        ]);
        
        let loadedProfiles: NewsletterOption[] = [];
        if (profiles) {
          // ensure we map them safely
          const validProfiles = profiles.filter((p:any) => !p.hidden);
          loadedProfiles = validProfiles.map((p:any) => ({
             id: p.slug || p.id || `profile-${Math.random()}`,
             persona: (p.persona || 'General').toUpperCase(),
             name: p.title || p.name,
             desc: p.description || p.shortDescription || '',
             colorClass: 'dark:text-[#A7A39B] text-[#6F7175]',
             borderColorClass: 'dark:border-stone-800/40 border-[#ECEBE6]',
             selectedColorClass: 'dark:bg-stone-900/40 bg-[#E8E6DF]/80'
          }));
        }
        setNewsletters(loadedProfiles.length > 0 ? loadedProfiles : [
           {id:'builder', persona:'BUILDER', name:'Forge', desc:'code, systems, technology', colorClass:'dark:text-[#A7A39B] text-[#6F7175]', borderColorClass:'dark:border-stone-800/40 border-[#ECEBE6]', selectedColorClass:'dark:bg-stone-900/40 bg-[#E8E6DF]/80'},
           {id:'operator', persona:'OPERATOR', name:'Signal', desc:'cybersecurity and digital infrastructure', colorClass:'dark:text-[#A7A39B] text-[#6F7175]', borderColorClass:'dark:border-stone-800/40 border-[#ECEBE6]', selectedColorClass:'dark:bg-stone-900/40 bg-[#E8E6DF]/80'},
           {id:'thinker', persona:'THINKER', name:'Inside the Head', desc:'philosophy, psychology, ideas', colorClass:'dark:text-[#A7A39B] text-[#6F7175]', borderColorClass:'dark:border-stone-800/40 border-[#ECEBE6]', selectedColorClass:'dark:bg-stone-900/40 bg-[#E8E6DF]/80'},
           {id:'wanderer', persona:'WANDERER', name:'Scribble', desc:'stories, travel, life experiences', colorClass:'dark:text-[#A7A39B] text-[#6F7175]', borderColorClass:'dark:border-stone-800/40 border-[#ECEBE6]', selectedColorClass:'dark:bg-stone-900/40 bg-[#E8E6DF]/80'}
        ]);
        
        if (issues) {
          let visibleIssues = issues.filter((i:any) => !i.hidden);
          visibleIssues.sort((a:any, b:any) => new Date(b.sentAt || b.createdAt || 0).getTime() - new Date(a.sentAt || a.createdAt || 0).getTime());
          
          setRecentLetters(visibleIssues.slice(0, 3).map((issue:any) => ({
             title: issue.title || issue.subject,
             persona: issue.persona || 'Updates',
             date: issue.sentAt || issue.createdAt || 'Recent',
             badgeStyle: 'dark:text-[#A7A39B] dark:bg-[#A7A39B]/10 bg-[#6F7175]/10 text-[#6F7175]'
          })));
        }
        
      } catch (e) {
        console.error("Error loading newsletter data", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleTopic = (cat: string) => {
    setSelectedTopics(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue || selectedTopics.length === 0) return;
    setIsSubmitting(true);
    
    const result = await subscribeNewsletter(emailValue, selectedTopics, 'main');
    
    setIsSubmitting(false);
    if (result.success) {
      setIsSubmitted(true);
      setEmailValue('');
    } else {
      alert(result.error || 'Failed to subscribe');
    }
  };

  if (loading) return (
    <div className="w-full dark:bg-[#050505] bg-[#F5F5F2] dark:text-[#e5e5e5] text-[#2B2B28] min-h-screen font-sans">
      {/* Fixed header skeleton */}
      <header className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-center z-50 dark:bg-[#050505]/80 bg-[#F5F5F2]/80 backdrop-blur-md border-b dark:border-stone-900/50 border-[#ECEBE6]">
        <div className="h-8 w-24 bg-primary/5 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-primary/5 rounded animate-pulse hidden md:block" />
          <div className="h-8 w-8 bg-primary/5 rounded animate-pulse" />
        </div>
      </header>
      {/* Main loading content */}
      <main className="pt-32 px-6 md:px-16 lg:px-24 max-w-310 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Left column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="h-4 w-48 bg-primary/5 rounded animate-pulse" />
            <div className="h-10 w-full bg-primary/5 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-primary/5 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-primary/5 rounded animate-pulse" />
          </div>
          {/* Right column - card grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 rounded-2xl border dark:border-stone-900/40 border-stone-200 bg-primary/[0.02] animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full dark:bg-[#050505] bg-[#F5F5F2] dark:text-[#e5e5e5] text-[#2B2B28] flex flex-col font-sans overflow-x-hidden relative min-h-screen dark:selection:bg-stone-800 selection:bg-stone-300 dark:selection:text-white selection:text-black"
    >
      {/* Global Header */}
      <header className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-center z-50 dark:bg-[#050505]/80 bg-[#F5F5F2]/80 backdrop-blur-md border-b dark:border-stone-900/50 border-[#ECEBE6]">
        <Link href={getPersonaUrl('main')} prefetch={true} className="hover:opacity-70 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          <DesktopNav persona="main" />
          <PersonaSearch mobileBgColor="dark:bg-[#050505] bg-[#F5F5F2]" />
          <ThemeToggle />
          <MobileNav persona="main" mobileBgColor="dark:bg-[#050505] bg-[#F5F5F2]" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col w-full relative pt-24 md:pt-32">
        
        {/* HERO + FORM SECTION (Section 1 & Section 2) */}
        <section className="px-6 md:px-16 lg:px-24 py-8 sm:py-12 md:py-16 relative z-10 w-full max-w-310 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            
            {/* HERO CONTENT: Left Side */}
            <div className={`lg:col-span-5 flex flex-col justify-center text-left lg:sticky lg:top-36 transition-all duration-500 ${
              isInputFocused ? 'max-md:opacity-40 max-md:scale-95' : 'opacity-100'
            }`}>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] dark:text-stone-100 text-[#2B2B28] tracking-tight mb-4 md:mb-6">
                Choose what you want to hear about.
              </h1>
              <p className="font-sans font-light dark:text-stone-400/90 text-[#6E6A64]/90 text-base sm:text-lg leading-relaxed max-w-sm mb-6">
                Thoughts, systems, stories, and ideas that stay with me long enough to write about.
              </p>

              {/* Underlying Value Proposition Hook */}
              <div className="hidden md:block font-serif italic text-xs sm:text-[13px] dark:text-stone-500 text-[#7A746B] space-y-2 border-l border-stone-300 dark:border-stone-800 pl-4 py-1 max-w-sm mb-8">
                <p>Published writing.</p>
                <p>Occasional notes.</p>
                <p>Rare things that never make it onto the website.</p>
              </div>
              

            </div>

            {/* INTERACTIVE FORM & SELECTION: Right Side */}
            <div className="lg:col-span-7 flex flex-col w-full">
              
              {/* Persona Cards Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
                {newsletters.map(nl => {
                  const isSelected = selectedTopics.includes(nl.id);
                  return (
                    <button
                      key={nl.id}
                      type="button"
                      onClick={() => toggleTopic(nl.id)}
                      className={`flex flex-col text-left p-5 rounded-2xl border transition-all duration-300 relative group cursor-pointer ${
                        isSelected 
                          ? 'dark:border-stone-400 border-stone-700 dark:bg-stone-900/50 bg-[#E3E0D8] -translate-y-0.5' 
                          : 'dark:border-stone-900/40 border-stone-200 dark:bg-stone-950/20 bg-stone-100/30 hover:dark:border-stone-800 hover:border-stone-350'
                      }`}
                    >
                      {/* Check indicator */}
                      <div className="absolute top-5 right-5 flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                          isSelected 
                            ? 'dark:bg-stone-200 bg-stone-900 dark:border-stone-200 border-stone-900 text-[#050505] dark:text-stone-950' 
                            : 'dark:border-stone-850 border-stone-300 group-hover:border-stone-550'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-3 text-stone-100 dark:text-stone-950" />}
                        </div>
                      </div>

                      <span className={`font-mono text-[9px] uppercase tracking-[0.2em] mb-2 block ${
                        isSelected ? 'dark:text-stone-200 text-stone-850 font-medium' : nl.colorClass
                      }`}>
                        {nl.persona}
                      </span>
                      <h3 className={`font-serif text-lg md:text-xl tracking-tight mb-1 font-medium transition-colors duration-300 ${
                        isSelected ? 'dark:text-white text-stone-900' : 'dark:text-stone-305 text-stone-800'
                      }`}>
                        {nl.name}
                      </h3>
                      <p className={`font-sans font-light text-xs md:text-sm leading-relaxed transition-colors duration-300 ${
                        isSelected ? 'dark:text-stone-350 text-stone-700' : 'dark:text-stone-500 text-stone-605'
                      }`}>
                        {nl.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Email Subscription Form */}
              <div className="w-full">
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl border dark:border-stone-800/80 border-stone-300 dark:bg-[#070707] bg-[#E8E6DF]/30 text-left"
                  >
                    <span className="font-mono text-[10px] tracking-[0.2em] dark:text-[#8c8273] text-[#7A746B] uppercase block mb-1">
                      SUBSCRIPTION SECURED
                    </span>
                    <h4 className="font-serif text-lg md:text-xl dark:text-stone-200 text-[#2B2B28] mb-2 font-medium">
                      Added nicely.
                    </h4>
                    <p className="font-sans font-light text-xs md:text-sm dark:text-stone-500 text-[#6E6A64] leading-relaxed">
                      You are now subscribed to: <strong className="font-medium dark:text-stone-300 text-[#2B2B28]">{selectedTopics.map(id => newsletters.find(n => n.id === id)?.name).join(', ')}</strong>. Welcome to these corners.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col w-full">
                    <div className="relative group w-full mb-4">
                      <input 
                        type="email"
                        required
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        placeholder="Email Address" 
                        className="w-full bg-transparent border-b dark:border-stone-800 border-stone-300 px-1 py-4 dark:text-stone-200 text-[#2B2B28] focus:outline-none focus:dark:border-[#8c8273] focus:border-[#7A746B] transition-colors duration-505 font-sans text-base font-light placeholder:dark:text-stone-700/80 placeholder:text-stone-400/80 rounded-none shadow-none"
                      />
                      <button 
                        type="submit"
                        disabled={isSubmitting || selectedTopics.length === 0}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 transition-all active:scale-95 duration-300 font-serif italic text-sm ${
                          selectedTopics.length === 0 
                            ? 'opacity-30 cursor-not-allowed dark:text-stone-700 text-stone-300' 
                            : 'dark:text-stone-300 text-stone-700 hover:dark:text-stone-100 hover:text-stone-950'
                        }`}
                        aria-label="Subscribe"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-t-transparent dark:border-stone-400 border-stone-700 rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Receive Letters</span>
                            <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Metadata & Secondary Supporting Text */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 px-1">
                      <div className="flex flex-col text-left">
                        <span className="dark:text-[#8c8273] text-[#7A746B] font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.15em] opacity-85">
                          Low frequency
                        </span>
                        <span className="dark:text-stone-500 text-[#8c8273] font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.15em] opacity-80">
                          High signal.
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="dark:text-stone-600 text-stone-450 font-sans font-light text-[10px] sm:text-[11px] leading-tight">
                          No schedules. no weekly promises.
                        </span>
                        <span className="dark:text-stone-550 text-stone-555 font-sans font-light text-[10px] sm:text-[11px] leading-tight italic">
                          only sending when there is something worth sending.
                        </span>
                      </div>
                    </div>

                    {selectedTopics.length === 0 && (
                      <p className="text-red-800/80 dark:text-amber-600/80 font-sans font-light text-xs mt-3 px-1">
                        * Please select at least one corner to subscribe to.
                      </p>
                    )}
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* --- DYNAMIC COLLAPSIBLE SECTIONS FOR MOBILE FOCUS --- */}
        {/* We use isInputFocused on mobile to elegantly slide and collapse these sections */}
        <div className={`transition-all duration-700 ease-in-out ${
          isInputFocused ? 'max-md:max-h-0 max-md:opacity-0 max-md:pointer-events-none max-md:overflow-hidden max-md:py-0 max-md:mt-0' : 'max-md:max-h-[5000px] max-md:opacity-100'
        }`}>

          {/* SECTION 3 — WHY SUBSCRIBE */}
          <section className="px-6 md:px-16 lg:px-24 py-12 md:py-16 relative z-10 w-full max-w-310 mx-auto border-t dark:border-stone-900/50 border-[#ECEBE6]">
            <span className="font-mono text-[9px] tracking-[0.25em] dark:text-[#8c8273] text-[#7A746B] uppercase mb-6 md:mb-8 block opacity-80">
              what to expect
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 md:p-6 rounded-2xl border dark:border-stone-900/30 border-stone-200/50 dark:bg-stone-950/10 bg-stone-100/10 flex flex-col">
                <span className="font-mono text-[10px] dark:text-stone-500 text-[#6E6A64] uppercase tracking-wider mb-2 block">
                  01
                </span>
                <h3 className="font-serif text-lg dark:text-stone-200 text-[#2B2B28] tracking-tight mb-2 font-medium">
                  Published Writing
                </h3>
                <p className="font-sans font-light text-xs md:text-sm dark:text-stone-500 text-[#6E6A64] leading-relaxed">
                  Most emails are published posts delivered directly to your inbox.
                </p>
              </div>

              <div className="p-5 md:p-6 rounded-2xl border dark:border-stone-900/30 border-stone-200/50 dark:bg-stone-950/10 bg-stone-100/10 flex flex-col">
                <span className="font-mono text-[10px] dark:text-stone-500 text-[#6E6A64] uppercase tracking-wider mb-2 block">
                  02
                </span>
                <h3 className="font-serif text-lg dark:text-stone-200 text-[#2B2B28] tracking-tight mb-2 font-medium">
                  Occasional Notes
                </h3>
                <p className="font-sans font-light text-xs md:text-sm dark:text-stone-500 text-[#6E6A64] leading-relaxed">
                  Project updates, announcements, discoveries, and things too small for a full article.
                </p>
              </div>

              <div className="p-5 md:p-6 rounded-2xl border dark:border-stone-900/30 border-stone-200/50 dark:bg-stone-950/10 bg-stone-100/10 flex flex-col">
                <span className="font-mono text-[10px] dark:text-stone-500 text-[#6E6A64] uppercase tracking-wider mb-2 block">
                  03
                </span>
                <h3 className="font-serif text-lg dark:text-stone-200 text-[#2B2B28] tracking-tight mb-2 font-medium">
                  Rare Extras
                </h3>
                <p className="font-sans font-light text-xs md:text-sm dark:text-stone-500 text-[#6E6A64] leading-relaxed">
                  Recommendations, experiments, and occasional email-only content.
                </p>
              </div>

            </div>
          </section>

          {/* SECTION 5 (REWORKED TO POSITION HERE) — NEWSLETTER PHILOSOPHY */}
          <section className="px-6 md:px-16 lg:px-24 py-16 md:py-24 relative z-10 w-full max-w-310 mx-auto border-t dark:border-stone-900/50 border-[#ECEBE6]">
            <div className="max-w-155 text-left mx-auto lg:mx-0">
              <span className="font-mono text-[9px] tracking-[0.25em] dark:text-[#8c8273] text-[#7A746B] uppercase mb-4 block opacity-80 font-bold">
                PHILOSOPHY
              </span>
              <h2 className="font-serif text-2xl md:text-3.5xl dark:text-stone-150 text-stone-900 mb-6 tracking-tight font-medium leading-tight">
                Why four newsletters?
              </h2>
              <div className="font-sans font-light dark:text-stone-400 text-[#5E5A53] text-[15px] sm:text-base leading-[1.8] space-y-5">
                <p>
                  A person cannot be honestly represented through one flattened identity. We contain systems, stories, defenses, and quiet observations, and trying to force those into a single stream results in either dilution or chaos.
                </p>
                <p>
                  Each newsletter represents a different mode of thinking, tuned to a specific corner of the digital mind. You can subscribe to whichever corners resonate with you.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4 (REWORKED TO POSITION HERE) — RECENT LETTERS */}
          <section className="px-6 md:px-16 lg:px-24 py-16 md:py-24 relative z-10 w-full max-w-310 mx-auto border-t dark:border-stone-900/50 border-[#ECEBE6]">
            <div className="max-w-225">
              <span className="font-mono text-[9px] tracking-[0.25em] dark:text-[#8c8273] text-[#7A746B] uppercase mb-10 block opacity-80">
                RECENT LETTERS
              </span>
              
              <div className="flex flex-col border-t dark:border-stone-900 border-stone-200">
                {recentLetters.length === 0 ? (
                  <div className="py-12 border-b dark:border-stone-900 border-stone-200 text-center font-mono text-xs dark:text-stone-500 text-stone-400">
                    [ No issues published yet. ]
                  </div>
                ) : recentLetters.map((letter, index) => (
                  <div 
                    key={index}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8 sm:py-10 border-b dark:border-stone-900 border-stone-200/80 hover:dark:bg-stone-900/20 hover:bg-stone-200/25 px-4 md:px-6 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex flex-col gap-3">
                      <span className={`font-mono text-[9px] tracking-widest px-2.5 py-0.5 rounded-sm uppercase self-start leading-none ${letter.badgeStyle}`}>
                        {letter.persona}
                      </span>
                      <h4 className="font-serif text-lg sm:text-xl md:text-2xl dark:text-stone-200 text-stone-800 tracking-tight font-medium group-hover:translate-x-1 transition-transform duration-300">
                        {letter.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-[11px] dark:text-stone-500 text-stone-500">
                        {letter.date}
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 dark:text-stone-400 text-stone-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 6 — CLOSING NOTE */}
          <section className="px-6 md:px-16 lg:px-24 py-16 md:py-24 relative z-10 w-full max-w-310 mx-auto border-t dark:border-stone-900/50 border-[#ECEBE6] text-center">
            <div className="max-w-xl mx-auto flex flex-col gap-2">
              <p className="font-serif text-xl md:text-2xl italic dark:text-stone-300 text-[#242422] tracking-tight">
                &quot;Most thoughts disappear.&quot;
              </p>
              <p className="font-mono text-[10px] tracking-[0.2em] dark:text-stone-500 text-[#7A746B] uppercase">
                These are the ones that stayed.
              </p>
            </div>
          </section>

        </div>

      </main>

      {/* Global Footer */}
      <footer className="w-full px-6 md:px-16 lg:px-24 py-6 md:py-10 flex flex-col md:flex-row justify-center items-center gap-5 md:gap-6 z-50 bg-transparent border-t dark:border-stone-850/20 border-[#ECEBE6]">
        <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" className="font-sans font-light text-[14px] dark:text-stone-500/60 text-[#6E6A64]/60 hover:dark:text-stone-400 hover:text-stone-900 transition-colors duration-500">
          GitHub
        </a>
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] dark:text-stone-600/50 text-[#6E6A64]/50">
          India · 2026
        </span>
        <a href={SOCIAL_LINKS.email} className="font-sans font-light text-[14px] dark:text-stone-500/60 text-[#6E6A64]/60 hover:dark:text-stone-400 hover:text-stone-900 transition-colors duration-500">
          Email
        </a>
      </footer>
    </motion.div>
  );
}
