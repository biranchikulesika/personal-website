import type { Metadata } from 'next';
import { SupportPageView } from '@/components/support-page';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Fund & Support',
  description:
    'Fund Biranchi Kulesika — support independent software tools, open essays on Scribble, and thoughtful technology.',
  alternates: { canonical: `${SITE_URL}/fund` },
  robots: { index: false },
};

export default function FundPage() {
  return <SupportPageView />;
}
