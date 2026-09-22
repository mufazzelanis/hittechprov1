"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { track } from "@/lib/track";

// Loads the Facebook Pixel and tracks a PageView on every page change (also mirrored to the Conversions API).
export default function FacebookPixel({ pixelId }) {
  const path = usePathname();

  useEffect(() => {
    track("PageView"); // no-op unless Pixel or Analytics is configured
  }, [path]);

  if (!pixelId || !/^\d{5,20}$/.test(pixelId)) return null;
  const code = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');`;
  return <Script id="fb-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
