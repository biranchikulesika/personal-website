import Script from 'next/script';

export type GoogleAnalyticsProps = {
  gaId?: string;
  strategy?: 'afterInteractive' | 'lazyOnload';
};

/**
 * Google Analytics 4 (gtag.js) integration for Next.js App Router.
 *
 * Uses `next/script` with `strategy="afterInteractive"` by default to ensure:
 * - Non-blocking asynchronous loading
 * - Zero impact on Core Web Vitals
 * - Global availability across all routes
 * - Native SPA history change tracking via GA4 Enhanced Measurement
 */
export default function GoogleAnalytics({
  gaId,
  strategy = 'lazyOnload',
}: GoogleAnalyticsProps) {
  const measurementId =
    gaId ||
    process.env.NEXT_PUBLIC_GA_ID?.trim().replace(/^["']|["']$/g, '') ||
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim().replace(/^["']|["']$/g, '') ||
    process.env.NEXT_PUBLIC_GTAG_ID?.trim().replace(/^["']|["']$/g, '');

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy={strategy}
      />
      <Script
        id="google-analytics-init"
        strategy={strategy}
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}
