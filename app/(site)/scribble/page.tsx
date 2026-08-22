import { ScribblePage } from "@/components/scribble-page";
import { SITE_URL } from "@/lib/constants";
import { breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { ContentService } from "@/lib/services/content.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scribble",
  description: "Writing and thinking, shared openly.",
  alternates: { canonical: `${SITE_URL}/scribble` },
  openGraph: {
    title: "Scribble",
    description: "Writing and thinking, shared openly.",
    url: `${SITE_URL}/scribble`,
    siteName: "Biranchi Kulesika",
    images: [
      {
        url: `${SITE_URL}/api/og?title=Scribble&type=scribble`,
        width: 1200,
        height: 630,
        alt: "Scribble",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@BKulesika",
    title: "Scribble",
    description: "Writing and thinking, shared openly.",
  },
};

export default async function ScribbleRoute() {
  const entries = await new ContentService().getScribbleEntries();

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Scribble", url: "/scribble" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <ScribblePage entries={entries} />
    </>
  );
}
