import { SupportPageView } from "@/components/support-page";
import { supportMetadata, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = supportMetadata();

export default function SupportPage() {
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Support", url: "/support" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <SupportPageView />
    </>
  );
}
