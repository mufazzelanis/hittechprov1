"use client";

import Script from "next/script";

// Pinterest Tag base code. Page visits and conversions are sent by lib/track.js (pintrk).
export default function PinterestTag({ tagId }) {
  if (!tagId || !/^\d{6,20}$/.test(tagId)) return null;
  const code = `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${tagId}');`;
  return <Script id="pinterest-tag" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
