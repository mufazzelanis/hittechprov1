"use client";

import Script from "next/script";

// Google Analytics 4. Page views are sent by lib/track.js on every route change (so the first load is not counted twice).
export default function GoogleAnalytics({ id }) {
  if (!id || !/^G-[A-Z0-9]{6,14}$/.test(id)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${id}',{send_page_view:false});` }} />
    </>
  );
}
