import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Newsreader } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { rootMetadata, websiteJsonLd, safeJsonLd } from '@/lib/seo';
import GoogleAnalytics from '@/components/google-analytics';
import GoogleTagManager from '@/components/google-tag-manager';
import MicrosoftClarity from '@/components/microsoft-clarity';
import { SvgElementGuard } from '@/components/svg-element-guard';
import { ToastContainer } from '@/components/ui/toast/toast-container';
import { StageTransitionProvider } from '@/components/paint-transition';
import { getSupabaseUrl } from '@/lib/config/env';

export const metadata: Metadata = rootMetadata;

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

export const viewport: Viewport = {
  themeColor: '#141413',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = getSupabaseUrl();
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${newsreader.variable}`}
    >
      <head>
        {supabaseUrl && (
          <link rel="dns-prefetch" href={supabaseUrl} />
        )}
      </head>
      <body className="min-h-screen bg-night text-paper antialiased">
        <GoogleTagManager />
        <GoogleAnalytics />
        <MicrosoftClarity />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd()) }}
        />
        <StageTransitionProvider>
          {children}
        </StageTransitionProvider>
        <ToastContainer />
        <SpeedInsights />
        <SvgElementGuard />
      </body>
    </html>
  );
}