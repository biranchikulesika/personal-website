import type { Metadata } from 'next';
import { SupportPageView } from '@/components/support-page';

export const metadata: Metadata = {
  title: 'Support & Patronage',
  description:
    'Support Biranchi Kulesika — fund independent software tools, open essays on Scribble, and thoughtful technology.',
};

export default function SupportPage() {
  return <SupportPageView />;
}
