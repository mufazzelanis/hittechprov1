import "./globals.css";
import { ThemeProvider, NO_FLASH_SCRIPT } from "@/lib/theme";
import CartProvider from "@/components/CheckoutProvider";
import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";
import FacebookPixel from "@/components/FacebookPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import LoadingSystem from "@/components/LoadingSystem";
import VisitTracker from "@/components/VisitTracker";
import JsonLd from "@/components/JsonLd";
import { getSettings } from "@/lib/settings";
import { siteUrl, absUrl, httpLinks, ogFallback } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Everything search engines and social sites see by default. Values come from Admin -> Settings -> SEO.
export async function generateMetadata() {
  const s = await getSettings();
  const favicon = (s.favicon || "").trim();
  return {
    metadataBase: new URL(siteUrl(s)),
    title: { default: s.seoTitle, template: "%s" },
    description: s.seoDescription,
    keywords: s.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean),
    applicationName: s.siteName,
    authors: [{ name: s.siteName, url: siteUrl(s) }],
    creator: s.siteName,
    publisher: s.siteName,
    manifest: "/manifest.webmanifest",
    icons: { icon: favicon || "/icons/favicon.png", apple: favicon || "/icons/icon-180.png" },
    appleWebApp: { capable: true, title: s.siteName, statusBarStyle: "black" },
    formatDetection: { telephone: false },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { type: "website", siteName: s.siteName, locale: "en_US", title: s.seoTitle, description: s.seoDescription, url: "/", images: [ogFallback(s)] },
    twitter: { card: "summary_large_image", title: s.seoTitle, description: s.seoDescription, images: [ogFallback(s)] },
    verification: {
      google: s.googleVerification || undefined,
      other: s.bingVerification ? { "msvalidate.01": s.bingVerification } : undefined,
    },
  };
}

// viewportFit "cover" lets us paint under the iPhone notch / home bar and handle it with env(safe-area-inset-*).
// Zoom is NOT disabled (accessibility).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0C" },
  ],
  colorScheme: "dark light",
};

export default async function RootLayout({ children }) {
  const s = await getSettings();
  const base = siteUrl(s);
  const phone = /\d/.test(s.phone) && !/x/i.test(s.phone) ? s.phone : undefined;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: s.siteName,
        alternateName: [...new Set(["hittechpro", "hittechpro.net", s.siteName])],
        url: base,
        logo: { "@type": "ImageObject", url: absUrl(s, (s.logo || "").trim() || "/icons/icon-512.png") },
        sameAs: httpLinks(s.facebook, s.instagram, s.linkedin, s.twitter, s.telegram, s.messenger),
        contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: s.contactEmail || undefined, telephone: phone, availableLanguage: ["English", "Bengali"] }],
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: s.siteName,
        inLanguage: "en",
        publisher: { "@id": `${base}/#organization` },
        potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${base}/tools?q={search_term_string}` }, "query-input": "required name=search_term_string" },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning data-fbp={s.fbPixelId ? "1" : undefined} data-ga={/^G-[A-Z0-9]{6,14}$/.test(s.gaId) ? "1" : undefined}>
      <head>
        {/* Sets data-theme before the page paints, so there is never a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="bg-ink text-fg antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <LoadingSystem />
          <VisitTracker />
          <JsonLd data={graph} />
          <CartProvider>{children}</CartProvider>
          <FacebookPixel pixelId={s.fbPixelId} />
          <GoogleAnalytics id={s.gaId} />
          <PWARegister />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
