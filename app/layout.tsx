import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Newsreader } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { rootMetadata, websiteJsonLd, safeJsonLd } from '@/lib/seo';
import { getGtmId } from '@/lib/config/env';
import { SvgElementGuard } from '@/components/svg-element-guard';

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
  const gtmId =
    process.env.NEXT_PUBLIC_GTM_ID?.trim().replace(/^["']|["']$/g, '') ||
    getGtmId();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${newsreader.variable}`}
    >
      <head>
        {gtmId ? (
          /* eslint-disable-next-line @next/next/next-script-for-ga */
          <script
            id="google-tag-manager"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`,
            }}
          />
        ) : null}
      </head>
      <body className="min-h-screen bg-night text-paper antialiased">
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd()) }}
        />
        {children}
        <SpeedInsights />
        <SvgElementGuard />
      </body>
    </html>
  );
}