"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { track } from "@/lib/track";

// Loads the Facebook Pixel and tracks a PageView on every page change (also mirrored to the Conversions API).
export default function FacebookPixel({ pixelId }) {
  const path = usePathname();

  useEffect(() => {
    // Meta's own pixel script sets _fbc from fbclid once it loads, but on a fast first conversion
    // (e.g. someone lands from an ad and buys within the first second) that race can be lost, which
    // breaks CAPI attribution for that click. Fill it in ourselves if it's still missing - in the exact
    // format Meta documents (fb.1.<ms-timestamp>.<fbclid>) - and never touch it again once it exists.
    try {
      if (!/(?:^|; )_fbc=/.test(document.cookie)) {
        const fbclid = new URLSearchParams(location.search).get("fbclid");
        if (fbclid) document.cookie = `_fbc=fb.1.${Date.now()}.${fbclid}; max-age=${90 * 86400}; path=/; SameSite=Lax`;
      }
    } catch {}
    track("PageView"); // no-op unless Pixel or Analytics is configured
  }, [path]);

  if (!pixelId || !/^\d{5,20}$/.test(pixelId)) return null;
  const code = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');`;
  return <Script id="fb-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
