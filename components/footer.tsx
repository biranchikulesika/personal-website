import Link from 'next/link';
import type { FooterContent } from '@/lib/types';

interface FooterProps {
  footer: FooterContent;
}

export function Footer({ footer }: FooterProps) {
  return (
    <footer className="bg-night text-cream">
      <div className="container-site py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Bio */}
          <div className="md:col-span-6">
            <p className="text-xl leading-relaxed">
              <strong className="font-semibold">{footer.bio.intro}</strong>
            </p>
            {footer.bio.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 text-base leading-relaxed text-cream/80"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Link columns — always side by side */}
          <div className="grid grid-cols-3 gap-8 md:col-span-6">
            {footer.columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-cream/50">
                  {column.title}
                </h4>
                <ul className="mt-6 space-y-4">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-lg transition-opacity hover:opacity-70"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p className="mt-12 text-sm font-semibold text-cream/70">{footer.bottom}</p>
      </div>
    </footer>
  );
}