import { HTMLAttributes } from 'react';

export const Blockquote = ({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) => (
  <blockquote
    className="border-l-2 pl-8 mt-6 mb-6 md:mt-8 md:mb-8 py-1 leading-relaxed border-primary font-serif italic text-[1.25rem] sm:text-[1.4rem] text-foreground opacity-90"
    {...props}
  >
    {children}
  </blockquote>
);
