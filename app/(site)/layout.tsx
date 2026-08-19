import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ContentService } from '@/lib/services/content.service';

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await new ContentService().getSiteContent();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar identity={site.identity} links={site.nav.links} />
      <main className="flex-1">{children}</main>
      <Footer footer={site.footer} />
    </div>
  );
}
