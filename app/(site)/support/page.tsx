import type { Metadata } from 'next';
import { SupportPageView } from '@/components/support-page';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Support & Patronage',
  description:
    'Support Biranchi Kulesika — fund independent software tools, open essays on Scribble, and thoughtful technology.',
  alternates: { canonical: `${SITE_URL}/support` },
  robots: { index: false },
};

export default function SupportPage() {
  return <SupportPageView />;
}
