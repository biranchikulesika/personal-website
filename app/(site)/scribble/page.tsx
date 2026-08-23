import { ScribblePage } from "@/components/scribble-page";
import { scribbleMetadata, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { ContentService } from "@/lib/services/content.service";
import type { Metadata } from "next";

export const metadata: Metadata = scribbleMetadata();

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
