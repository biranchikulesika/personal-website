import NextLink from 'next/link';
import { AnchorHTMLAttributes } from 'react';

export const Link = ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isInternal = href && (href.startsWith('/') || href.startsWith('#'));

  if (isInternal) {
    return (
      <NextLink
        href={href}
        className="underline underline-offset-4 decoration-primary/30 hover:decoration-primary/80 text-primary transition-colors"
        {...props}
      >
        {children}
      </NextLink>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4 decoration-primary/30 hover:decoration-primary/80 text-primary transition-colors"
      {...props}
    >
      {children}
    </a>
  );
};
