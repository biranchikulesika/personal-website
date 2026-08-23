import { SupportPageView } from "@/components/support-page";
import { supportMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = supportMetadata();

export default function SupportPage() {
  return <SupportPageView />;
}
