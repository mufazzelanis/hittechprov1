import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// NOTE: starter policy text. Have it reviewed against your real business terms before launch.
const PAGES = {
  privacy: {
    title: "Privacy Policy",
    sections: (s) => [
      ["Information we collect", "When you order or create an account we collect your name, email address, phone number and payment transaction reference. We also record basic usage data such as pages visited and referral links used."],
      ["How we use it", "To process and deliver your orders, provide support, prevent fraud, pay affiliate commissions and improve the service. We do not sell your personal data."],
      ["Sharing", "We share data only with providers needed to run the service (hosting, payment verification) or when required by law."],
      ["Cookies", "We use cookies to keep you signed in and to attribute affiliate referrals for a limited period."],
      ["Your rights", `You can request access, correction or deletion of your data at any time by emailing ${s.contactEmail}.`],
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: (s) => [
      ["Service", `${s.siteName} provides access to premium software subscriptions. Some tools are shared between members and some are private slots; each listing states which.`],
      ["Acceptable use", "Access is for your own use only. Sharing, reselling or publishing login details, or misusing a tool, may lead to immediate suspension without refund."],
      ["Availability", "We monitor tools continuously and replace failing access quickly, but third-party providers can change or interrupt their services, so uninterrupted availability cannot be guaranteed."],
      ["Payments", "Prices are shown in BDT. An order is confirmed after we verify your payment transaction."],
      ["Affiliate program", "Commissions are paid on confirmed orders only. Self-referrals, spam and misleading promotion are not allowed and can void earnings."],
      ["Changes", "We may update these terms; continued use means you accept the updated terms."],
    ],
  },
  refund: {
    title: "Refund Policy",
    sections: (s) => [
      ["When you get a refund", "If a tool you purchased does not work and we cannot fix or replace it, we refund the unused portion. Report the problem to support and we will process eligible refunds within 24 hours of confirming the issue."],
      ["What is not refundable", "Access already used successfully, accounts suspended for breaking the terms, and change-of-mind requests after delivery."],
      ["How to request", `Email ${s.contactEmail} or message us on WhatsApp/Telegram with your order number.`],
    ],
  },
};

export async function generateMetadata({ params }) {
  const p = PAGES[params.page];
  return p ? { title: `${p.title} | HiT Tech Pro`, description: `${p.title} of HiT Tech Pro (hittechpro.net).`, alternates: { canonical: `/${params.page}` } } : { title: "Not found" };
}

export default async function LegalPage({ params }) {
  const p = PAGES[params.page];
  if (!p) notFound();
  const s = await getSettings();
  return (
    <SiteShell>
      <article className="container-x max-w-3xl pt-32 pb-24">
        <h1 className="font-display text-4xl font-bold">{p.title}</h1>
        <p className="text-xs text-mist mt-2">Last updated {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
        <div className="mt-10 space-y-8">
          {p.sections(s).map(([h, b]) => (
            <section key={h}>
              <h2 className="font-display font-semibold text-lg mb-2">{h}</h2>
              <p className="text-mist text-sm leading-relaxed">{b}</p>
            </section>
          ))}
        </div>
      </article>
    </SiteShell>
  );
}
