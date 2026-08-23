import { AboutPageView } from "@/components/about-page";
import { SITE_URL } from "@/lib/constants";
import { breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { ContentService } from "@/lib/services/content.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "A little about Biranchi Kulesika, his work, writing, interests, and the things he is learning along the way",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About",
    description:
      "A little about Biranchi Kulesika, his work, writing, interests, and the things he is learning along the way",
    url: `${SITE_URL}/about`,
    siteName: "Biranchi Kulesika",
    images: [
      {
        url: `${SITE_URL}/api/og?title=About&type=about`,
        width: 1200,
        height: 630,
        alt: "About Biranchi Kulesika",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@BKulesika",
    title: "About",
    description:
      "A little about Biranchi Kulesika, his work, writing, interests, and the things he is learning along the way",
  },
};

export default async function AboutPage() {
  const service = new ContentService();
  const [site, writing] = await Promise.all([
    service.getSiteContent(),
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
