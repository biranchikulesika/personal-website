'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export type GoogleAnalyticsProps = {
  gaId?: string;
  strategy?: 'afterInteractive' | 'lazyOnload';
};

export default function GoogleAnalytics({
  gaId,
}: GoogleAnalyticsProps) {
  const measurementId =
    gaId ||
    process.env.NEXT_PUBLIC_GA_ID?.trim().replace(/^["']|["']$/g, '') ||
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim().replace(/^["']|["']$/g, '') ||
    process.env.NEXT_PUBLIC_GTAG_ID?.trim().replace(/^["']|["']$/g, '');

  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!measurementId) return;

    const trigger = () => {
      setShouldLoad(true);
      window.removeEventListener('scroll', trigger);
      window.removeEventListener('pointerdown', trigger);
      window.removeEventListener('keydown', trigger);
      window.removeEventListener('touchstart', trigger);
    };

    window.addEventListener('scroll', trigger, { passive: true, once: true });
    window.addEventListener('pointerdown', trigger, { passive: true, once: true });
    window.addEventListener('keydown', trigger, { passive: true, once: true });
    window.addEventListener('touchstart', trigger, { passive: true, once: true });

    const timer = setTimeout(trigger, 4000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', trigger);
      window.removeEventListener('pointerdown', trigger);
      window.removeEventListener('keydown', trigger);
      window.removeEventListener('touchstart', trigger);
    };
  }, [measurementId]);

  if (!measurementId || !shouldLoad) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
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
