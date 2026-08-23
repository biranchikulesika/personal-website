import { NowPageView } from "@/components/now-page";
import { SITE_URL } from "@/lib/constants";
import { breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { ContentService } from "@/lib/services/content.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now",
  description:
    "What I’m reading, exploring, working on, and thinking about these days.",
  alternates: { canonical: `${SITE_URL}/now` },
  openGraph: {
    title: "Now",
    description:
      "What I’m reading, exploring, working on, and thinking about these days.",
    url: `${SITE_URL}/now`,
    siteName: "Biranchi Kulesika",
    images: [
      {
        url: `${SITE_URL}/api/og?title=Now&type=now`,
        width: 1200,
        height: 630,
        alt: "Now",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@BKulesika",
    title: "Now",
    description:
      "What I’m reading, exploring, working on, and thinking about these days.",
  },
};

export const dynamic = "force-dynamic";

export default async function NowPage() {
  const contentService = new ContentService();
  const entries = await contentService.getNowEntries();

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Now", url: "/now" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <NowPageView entries={entries} />
    </>
  );
}
