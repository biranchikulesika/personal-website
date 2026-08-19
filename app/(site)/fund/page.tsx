import type { Metadata } from 'next';
import { SupportPageView } from '@/components/support-page';

export const metadata: Metadata = {
  title: 'Fund & Support',
  description:
    'Fund Biranchi Kulesika — support independent software tools, open essays on Scribble, and thoughtful technology.',
};

export default function FundPage() {
  return <SupportPageView />;
}
