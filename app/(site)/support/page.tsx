import { SupportPageView } from "@/components/support-page";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support & Patronage",
  description:
    "Support my work and help me keep building, writing, and sharing things openly.",
  alternates: { canonical: `${SITE_URL}/support` },
  openGraph: {
    title: "Support & Patronage",
    description:
      "Support my work and help me keep building, writing, and sharing things openly.",
    url: `${SITE_URL}/support`,
    siteName: "Biranchi Kulesika",
    images: [
      {
        url: `${SITE_URL}/api/og?title=Support%20%26%20Patronage&type=support`,
        width: 1200,
        height: 630,
        alt: "Support & Patronage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@BKulesika",
    title: "Support & Patronage",
    description:
      "Support my work and help me keep building, writing, and sharing things openly.",
  },
};

export default function SupportPage() {
  return <SupportPageView />;
}
