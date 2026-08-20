import type { Metadata } from 'next';
import { Space_Grotesk, Newsreader } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Biranchi Kulesika',
  description: 'Personal website — rebuild in progress.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${newsreader.variable}`}
    >
      <body className="min-h-screen bg-night text-paper antialiased">
        {children}
      </body>
    </html>
  );
}