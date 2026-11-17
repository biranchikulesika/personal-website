import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { NewsletterPopup } from '@/components/newsletter-popup';
import { SITE_CONFIG } from '@/lib/config/site';

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = SITE_CONFIG;

  return (
    <div className="flex min-h-screen flex-col select-none [&_input]:select-text [&_textarea]:select-text">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar identity={site.identity} links={site.nav.links} />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer footer={site.footer} />
      <NewsletterPopup newsletter={site.hero.newsletter} />
    </div>
  );
}
