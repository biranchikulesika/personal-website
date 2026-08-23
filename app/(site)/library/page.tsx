import { LibraryPageView } from "@/components/library-page";
import { SITE_URL } from "@/lib/constants";
import { breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { ContentService } from "@/lib/services/content.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library",
  description: "Books I’ve read, loved, and think are worth recommending.",
  alternates: { canonical: `${SITE_URL}/library` },
  openGraph: {
    title: "Library",
    description: "Books I’ve read, loved, and think are worth recommending.",
    url: `${SITE_URL}/library`,
    siteName: "Biranchi Kulesika",
    images: [
      {
        url: `${SITE_URL}/api/og?title=Library&type=library`,
        width: 1200,
        height: 630,
        alt: "Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@BKulesika",
    title: "Library",
    description: "Books I’ve read, loved, and think are worth recommending.",
  },
};

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function LibraryPage() {
  const library = await new ContentService().getLibrary();

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Library", url: "/library" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <LibraryPageView
        books={shuffle(library.items)}
        title={library.title}
        subheader={library.subheader}
      />
    </>
  );
}
