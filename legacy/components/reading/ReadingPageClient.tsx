'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { getPersonaUrl } from '@/lib/utils';
import type { Book } from '@/lib/types';

// Deterministic cover style generator — 6 distinct visual palettes
// Uses persona theme tokens for text/borders while keeping varied backgrounds
const getCoverStyle = (title: string) => {
  const styles = [
    'bg-[#F4F1EA] dark:bg-[#1F2124] text-heading border-border-subtle',
    'bg-[#ECE2DB] dark:bg-[#25201C] text-heading border-border-subtle',
    'bg-[#E5E9EC] dark:bg-[#191D21] text-heading border-border-subtle',
    'bg-[#D7D8D2] dark:bg-[#1A1D1A] text-heading border-border-subtle',
    'bg-[#EFECE6] dark:bg-[#1C1E20] text-heading border-border-subtle',
    'bg-[#EBEBE4] dark:bg-[#1D1F1B] text-heading border-border-subtle',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
};

export default function ReadingPageClient({ initialBooks }: { initialBooks: Book[] }) {
  const books = initialBooks.filter(b => !b.hidden);
  const recommendedBooks = books.filter(b => b.featured);
  const bookshelfBooks = books.filter(b => !b.featured);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className='w-full font-sans text-body antialiased relative'
    >
      {/* Subtle background glow */}
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-80 bg-amber-900/5 dark:bg-amber-900/10 blur-[120px] rounded-full pointer-events-none' />
      <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-60 bg-stone-800/5 dark:bg-stone-800/10 blur-[100px] rounded-full pointer-events-none' />

      <div className='relative z-10 max-w-6xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 py-10 md:py-20'>
        
        {/* Back navigation */}
        <Link 
          href={getPersonaUrl('thinker', '/')} 
          className='group text-[11px] tracking-[0.15em] font-mono text-muted-text hover:text-heading transition-colors duration-300 inline-flex items-center gap-2 mb-16 uppercase'
        >
          <span className='transition-transform duration-300 group-hover:-translate-x-1'>&larr;</span> 
          Back
        </Link>

        {/* Page Header */}
        <header className='mb-20 md:mb-28'>
          <div className='flex flex-col gap-2 mb-6'>
            <h1 className='text-4xl md:text-5xl lg:text-[3.5rem] text-heading tracking-wide font-cormorant font-normal leading-tight select-none'>
              Reading Shelf
            </h1>
            <p className='text-muted-text text-[15.5px] md:text-lg font-light leading-relaxed max-w-xl'>
              Books that shaped how I think, learn, and see the world.
            </p>
          </div>

          {/* Book count — subtle shelf-like visual */}
          <div className='flex items-center gap-3 text-muted-text/70'>
            <span className='text-[11px] font-mono tracking-widest uppercase select-none'>
              {books.length} {books.length === 1 ? 'book' : 'books'} collected
            </span>
            <span className='h-px flex-1 bg-border-subtle hidden sm:block' />
          </div>
        </header>

        {books.length === 0 ? (
          <div className='py-24 text-center border border-dashed border-border-subtle rounded-sm bg-surface/30'>
            <p className='text-muted-text text-[15px] font-light'>
              The shelf is currently empty. Check back soon for new additions.
            </p>
          </div>
        ) : (
          <div className='space-y-28 md:space-y-40'>
            
            {/* SECTION 1: RECOMMENDED FIRST */}
            {recommendedBooks.length > 0 && (
              <section id='recommended' className='scroll-mt-24'>
                <div className='flex items-center gap-4 mb-12'>
                  <span className='text-[10px] md:text-[11px] tracking-[0.25em] text-muted-text font-mono uppercase'>
                    Recommended First
                  </span>
                  <span className='h-px flex-1 bg-border-subtle' />
                </div>
                
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-14 sm:gap-y-20'>
                  {recommendedBooks.map((book, idx) => {
                    const coverStyle = getCoverStyle(book.title);
                    return (
                    <div key={book.id || idx} className='group flex flex-col'>
                      <div className='w-full'>
                        {/* Simulated Book Cover */}
                        <div className={`aspect-2/3 w-full max-w-44 sm:max-w-48 mx-auto md:mx-0 relative mb-6 rounded-sm shadow-sm md:shadow border ${coverStyle} overflow-hidden select-none flex flex-col justify-between p-5 sm:p-6 transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-1.5`}>
                          {/* Spine crease */}
                          <div className='absolute top-0 bottom-0 left-2 sm:left-3 w-px bg-black/8 dark:bg-white/5 shadow-[1px_0_2px_rgba(0,0,0,0.04)] h-full' />
                          
                          <div className='flex flex-col h-full justify-between relative z-10 pl-1.5 sm:pl-2'>
                            {/* Top label */}
                            <span className='text-[7.5px] sm:text-[8px] font-mono tracking-[0.2em] opacity-40 uppercase'>
                              Recommended
                            </span>
                            
                            {/* Title */}
                            <div className='my-auto py-3 sm:py-4'>
                              <h4 className='text-lg sm:text-xl md:text-2xl font-cormorant font-normal leading-tight tracking-wide mb-1 line-clamp-2 select-text'>
                                {book.title}
                              </h4>
                              <p className='text-[10px] sm:text-[11.5px] italic font-cormorant opacity-75 line-clamp-1 select-text'>
                                {book.author}
                              </p>
                            </div>
                            
                            {/* Bottom publisher detail */}
                            <div className='flex items-center justify-between border-t border-current/10 pt-2 sm:pt-3 opacity-30 text-[7px] sm:text-[8px] font-mono tracking-wider'>
                              <span>RECOMMENDED</span>
                              <span className='opacity-70'>STUDY</span>
                            </div>
                          </div>
                        </div>

                        <h3 className='text-lg sm:text-xl font-cormorant font-normal text-heading tracking-wide mb-1 group-hover:text-accent-text transition-colors duration-300'>
                          {book.title}
                        </h3>
                        <p className='text-[11px] sm:text-[11.5px] italic font-cormorant text-muted-text mb-3'>
                          {book.author}
                        </p>
                      </div>
                      
                      {/* Personal Note */}
                      {book.notes && (
                        <div className='mt-1 border-l-2 border-border-subtle pl-3'>
                          <p className='text-[13px] sm:text-[13.5px] text-body leading-relaxed font-light line-clamp-3 italic'>
                            {book.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </section>
            )}

            {/* SECTION 2: BOOKSHELF */}
            {bookshelfBooks.length > 0 && (
              <section id='bookshelf' className='scroll-mt-24 pb-16'>
                <div className='flex items-center gap-4 mb-12'>
                  <span className='text-[10px] md:text-[11px] tracking-[0.25em] text-muted-text font-mono uppercase'>
                    Book Shelf
                  </span>
                  <span className='h-px flex-1 bg-border-subtle' />
                </div>
                
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 sm:gap-x-8 lg:gap-x-10 gap-y-12 sm:gap-y-14'>
                  {bookshelfBooks.map((book, idx) => {
                    const coverStyle = getCoverStyle(book.title);
                    return (
                    <div 
                      key={book.id || idx} 
                      className='group flex flex-col'
                    >
                      <div className='w-full'>
                        {/* Simulated Book Cover */}
                        <div className={`aspect-2/3 w-full relative mb-4 rounded-sm border ${coverStyle} overflow-hidden select-none flex flex-col justify-between p-3 sm:p-4 transition-all duration-500 group-hover:shadow-md group-hover:-translate-y-1.5`}>
                          {/* Spine crease */}
                          <div className='absolute top-0 bottom-0 left-2 sm:left-2.5 w-px bg-black/8 dark:bg-white/5 shadow-[1px_0_2px_rgba(0,0,0,0.04)] h-full' />
                          
                          <div className='flex flex-col h-full justify-between relative z-10 pl-1.5 sm:pl-2'>
                            {/* Serial */}
                            <span className='text-[6.5px] sm:text-[7.5px] font-mono tracking-widest opacity-40 uppercase truncate block'>
                              No. {String(idx + 1).padStart(2, '0')}
                            </span>
                            
                            {/* Title */}
                            <div className='my-auto py-1 sm:py-2'>
                              <h4 className='text-[11px] sm:text-xs md:text-sm font-cormorant leading-tight tracking-wide font-normal mb-0.5 line-clamp-2 select-text'>
                                {book.title}
                              </h4>
                              <p className='text-[8px] sm:text-[9.5px] font-sans font-light opacity-75 line-clamp-1 select-text'>
                                {book.author}
                              </p>
                            </div>
                            
                            {/* Shelf marking */}
                            <div className='flex items-center justify-between text-[6.5px] sm:text-[7.5px] font-mono tracking-widest opacity-35 whitespace-nowrap overflow-hidden'>
                              <span className='truncate'>{book.category?.toUpperCase() || 'STUDY'}</span>
                              <span className='opacity-70 shrink-0'>B.K.</span>
                            </div>
                          </div>
                        </div>

                        <h3 className='text-[13px] sm:text-[14.5px] md:text-base font-sans font-normal text-heading leading-snug mb-0.5 group-hover:text-accent-text transition-colors duration-300 line-clamp-2 min-h-9 sm:min-h-11'>
                          {book.title}
                        </h3>
                        <p className='text-[10.5px] sm:text-[11.5px] italic font-cormorant text-muted-text mb-2 leading-none line-clamp-1'>
                          {book.author}
                        </p>
                      </div>
                      
                      {/* Category Tag */}
                      {book.category && (
                        <div className='mt-1'>
                          <span className='inline-block text-[8px] sm:text-[9px] tracking-wider font-mono text-muted-text uppercase border border-border-subtle px-2 py-0.5 rounded-full select-none opacity-85 hover:opacity-100 transition-opacity'>
                            {book.category}
                          </span>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </motion.div>
  );
}
