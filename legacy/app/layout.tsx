import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Inter, JetBrains_Mono, Playfair_Display, Cormorant_Garamond, Spectral } from 'next/font/google';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/theme-provider';
import { AnalyticsWrapper } from '@/components/analytics-wrapper';
import { SITE_URL, SITE_NAME, AUTHOR } from '@/lib/config/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-spectral',
  display: 'swap',
  // Only preload the most-used weight; others load via swap
  preload: true,
  adjustFontFallback: false,
});


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F5F2' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Biranchi Kulesika',
  description: 'Personal website of Biranchi Kulesika. Writing about technology, cybersecurity, philosophy, and the spaces in between.',
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  category: 'technology',
  keywords: ['Biranchi Kulesika', 'personal website', 'blog', 'cybersecurity', 'philosophy', 'writing', 'technology'],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: SITE_URL,
    images: [
      {
        url: '/images/og-main.png',
        width: 1200,
        height: 630,
        alt: 'Biranchi Kulesika — Personal Website',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR.twitter,
    site: AUTHOR.twitter,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: SITE_URL,
      'x-default': SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/biranchi.png', type: 'image/png' },
    ],
    shortcut: ['/images/biranchi.png'],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#050505' },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': SITE_NAME,
    'format-detection': 'telephone=no',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme');
  const serverTheme = themeCookie ? themeCookie.value : 'dark';

  return (
    <html lang="en" suppressHydrationWarning className={`${serverTheme} ${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${spectral.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/20">
        {/* Skip-to-content link for accessibility — must be first focusable element */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:outline-none"
        >
          Skip to content
        </a>
        {/* RSS feed auto-discovery */}
        <link rel="alternate" type="application/rss+xml" title="Biranchi Kulesika" href="/feed.xml" />
        {/* Sitemap auto-discovery */}
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
        {/* Preload critical OG image for faster LCP */}
        <link rel="preload" href="/images/og-main.png" as="image" />
        {/* Preconnect to external origins */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <ThemeProvider attribute="class" defaultTheme={serverTheme} enableSystem={false}>
          <div id="main-content">
            {children}
          </div>
          <AnalyticsWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}


