import { HTMLAttributes } from 'react';

export const H1 = ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground mt-12 mb-6 tracking-tight" {...props}>
    {children}
  </h1>
);

export const H2 = ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className="font-serif font-bold text-2xl md:text-3xl text-foreground mt-10 mb-4 tracking-tight" {...props}>
    {children}
  </h2>
);

export const H3 = ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className="font-serif font-bold text-xl md:text-2xl text-foreground mt-8 mb-3" {...props}>
    {children}
  </h3>
);

export const H4 = ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h4 className="font-serif font-semibold text-lg md:text-xl text-foreground mt-6 mb-2" {...props}>
    {children}
  </h4>
);
