'use client';

import { useState } from 'react';

export function FragmentCycler({ fragments }: { fragments: string[] }) {
  const [fragmentIndex, setFragmentIndex] = useState(0);
  const currentFrag = fragments.length > 0 ? fragments[fragmentIndex] : null;

  const handleNext = () => {
    if (fragments.length > 0) setFragmentIndex((prev) => (prev + 1) % fragments.length);
  };

  return (
    <section id="fragment-section" className="py-20 lg:py-28 relative overflow-hidden select-none border-t border-[#E5DCCF]/10 dark:border-[#26201B]/10">
      <div className="flex items-center justify-between mb-8 opacity-75">
        <span className="text-[9.5px] font-sans tracking-[0.25em] text-[#9d613c]/70 dark:text-[#B97A56]/70 uppercase font-medium">
          FRAGMENT • NO. 8
        </span>
        <button
          onClick={handleNext}
          className="text-[9.5px] font-sans uppercase tracking-widest text-[#7c6e62]/80 dark:text-[#B6A798]/75 hover:text-[#9d613c] dark:hover:text-[#B97A56] underline cursor-pointer duration-300 transition-colors bg-transparent border-none p-0"
          id="fragment-cycle-button"
        >
          READ ANOTHER
        </button>
      </div>

      <div className="min-h-17.5 flex items-center pr-4">
        <p className="text-[17.5px] sm:text-lg italic font-light text-[#43382F] dark:text-[#E1D5C8] leading-relaxed max-w-xl pl-5 border-l border-[#9d613c]/20 dark:border-[#B97A56]/20 transition-all duration-500 ease-in-out">
          {currentFrag ? `"${currentFrag}"` : 'No fragments collected yet.'}
        </p>
      </div>
    </section>
  );
}
