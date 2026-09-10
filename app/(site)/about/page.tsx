import { AboutPageView } from "@/components/about-page";
import { aboutMetadata, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { ContentService } from "@/lib/services/content.service";
import { SITE_CONFIG } from "@/lib/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = aboutMetadata();

export default async function AboutPage() {
  const site = SITE_CONFIG;
  const service = new ContentService();
  const [writing] = await Promise.all([
    service.getWriting(),
  ]);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "About", url: "/about" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <AboutPageView site={site} featuredWriting={writing.items} />
    </>
  );
}
