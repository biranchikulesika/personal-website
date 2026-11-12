import { AboutPageView } from "@/components/about-page";
import { aboutMetadata, breadcrumbJsonLd, personJsonLd, safeJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = aboutMetadata();

export default function AboutPage() {
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "About", url: "/about" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <AboutPageView />
    </>
  );
}
