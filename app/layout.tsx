import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Space_Grotesk, Newsreader } from 'next/font/google';
import './globals.css';
import { rootMetadata, websiteJsonLd, safeJsonLd } from '@/lib/seo';

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

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: '#141413',
  colorScheme: 'dark',
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
      <head>
        <Script
          id="svg-element-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(typeof SVGElement!=='undefined'&&SVGElement.prototype){Object.defineProperty(SVGElement.prototype,'correspondingUseElement',{get:function(){return null;},set:function(){},configurable:true});Object.defineProperty(SVGElement.prototype,'correspondingElement',{get:function(){return null;},set:function(){},configurable:true});}}catch(e){}if(typeof window!=='undefined'){window.addEventListener('error',function(e){var m=e&&e.message?String(e.message):'';if(m.indexOf('correspondingUseElement')!==-1||m.indexOf('nodeType')!==-1||m.indexOf('Permission denied to access property')!==-1){if(e.stopImmediatePropagation)e.stopImmediatePropagation();if(e.preventDefault)e.preventDefault();return true;}},true);window.addEventListener('unhandledrejection',function(e){var m=e&&e.reason?(e.reason.message||String(e.reason)):'';if(m.indexOf('correspondingUseElement')!==-1||m.indexOf('nodeType')!==-1||m.indexOf('Permission denied to access property')!==-1){if(e.stopImmediatePropagation)e.stopImmediatePropagation();if(e.preventDefault)e.preventDefault();}},true);}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd()) }}
        />
      </head>
      <body className="min-h-screen bg-night text-paper antialiased">
        {children}
      </body>
    </html>
  );
}