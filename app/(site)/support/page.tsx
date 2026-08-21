import type { Metadata } from 'next';
import { SupportPageView } from '@/components/support-page';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Support & Patronage',
  description:
    'Support Biranchi Kulesika — fund independent software tools, open essays on Scribble, and thoughtful technology.',
  alternates: { canonical: `${SITE_URL}/support` },
  openGraph: {
    title: 'Support & Patronage | Biranchi Kulesika',
    description:
      'Support Biranchi Kulesika — fund independent software tools, open essays on Scribble, and thoughtful technology.',
    url: `${SITE_URL}/support`,
    siteName: 'Biranchi Kulesika',
    images: [{ url: `${SITE_URL}/api/og?title=Support%20%26%20Patronage&type=support`, width: 1200, height: 630, alt: 'Support & Patronage' }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@BKulesika',
    title: 'Support & Patronage | Biranchi Kulesika',
    description:
      'Support Biranchi Kulesika — fund independent software tools, open essays on Scribble, and thoughtful technology.',
  },
};

export default function SupportPage() {
  return <SupportPageView />;
}
