import Link from 'next/link';
import type { FooterContent } from '@/lib/types';

interface FooterProps {
  footer: FooterContent;
}

export function Footer({ footer }: FooterProps) {
  return (
    <footer className="border-t border-tinted/10 bg-[#0e0e0d] text-paper">
      <div className="container-site py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Bio */}
          <div className="max-w-lg md:col-span-5">
            <p className="text-xl leading-relaxed">
              <strong className="font-semibold text-paper">{footer.bio.intro}</strong>
            </p>
            {footer.bio.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 text-base leading-relaxed text-ink-soft"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Link columns: always side by side */}
          <div className="grid grid-cols-3 gap-8 md:col-span-6 md:col-start-7">
            {footer.columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {column.title}
                </h2>
                <ul className="mt-6 space-y-4">
                  {column.links.map((link) => {
                    const isExternal =
                      link.href.startsWith('http') || link.href.startsWith('mailto:');
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center gap-1.5 text-base text-paper/90 transition-colors hover:text-accent"
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p className="mt-12 text-sm font-semibold text-ink-soft">{footer.bottom}</p>
      </div>
    </footer>
  );
}