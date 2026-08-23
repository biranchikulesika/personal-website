import { NowPageView } from "@/components/now-page";
import { nowMetadata, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { ContentService } from "@/lib/services/content.service";
import type { Metadata } from "next";

export const metadata: Metadata = nowMetadata();

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
