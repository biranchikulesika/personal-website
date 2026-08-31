import Script from 'next/script';

export type GoogleTagManagerProps = {
  gtmId?: string;
  strategy?: 'afterInteractive' | 'lazyOnload';
};

export default function GoogleTagManager({
  gtmId,
  strategy = 'lazyOnload',
}: GoogleTagManagerProps) {
  const containerId =
    gtmId || process.env.NEXT_PUBLIC_GTM_ID?.trim().replace(/^["']|["']$/g, '');

  if (!containerId) {
    return null;
  }

  return (
    <>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
      <Script
        id="google-tag-manager"
        strategy={strategy}
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`,
        }}
      />
    </>
  );
}
