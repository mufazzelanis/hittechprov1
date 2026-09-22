import { MapPin, Phone, Mail, Users } from "lucide-react";
import BrandLogo, { glowOf } from "./BrandLogo";
import Reveal from "./Reveal";
import Logo from "./Logo";
import { getPaymentOptions } from "@/lib/payments";
import { getChannels } from "@/lib/channels";
import { getSocialLinks } from "@/lib/socials";
import RichText from "./RichText";
import { dhakaDay } from "@/lib/dhaka";

const cols = [
  { title: "Services", links: [["Premium SEO Tools", "#tools"], ["Marketing & Analytics", "#tools"], ["Design & Creative Suite", "#tools"], ["AI Content Creation", "#tools"]] },
  { title: "Our Tools", links: [["All Tools", "#tools"], ["Bundles", "#bundles"], ["Private Accounts", "#custom"], ["Tool Limits", "/limits"], ["Free Offers", "/free-offers"]] },
  { title: "About Us", links: [["Reviews", "#reviews"], ["Pricing & Plans", "#bundles"], ["FAQ", "#faq"], ["Contact Support", "#contact"]] },
];

export default function Footer({ s }) {
  const [first, ...rest] = s.siteName.split(" ");
  const channels = getChannels(s);
  const socials = getSocialLinks(s);

  return (
    <>
      <section id="contact" className="py-20 border-t border-line">
        <div className="container-x">
          <Reveal className="rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/[0.08] to-panel p-8 flex flex-col md:flex-row items-center gap-8">
            <span className="hidden sm:flex w-16 h-16 rounded-full bg-brand/15 text-brand items-center justify-center shrink-0"><Users size={26} /></span>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display font-bold text-xl">{s.chanTitle}</h3>
              <p className="text-mist text-sm mt-2 leading-relaxed">
                {s.chanText}
              </p>
            </div>
            <div className="flex gap-3">
              {channels.map((c, i) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={/^https?:/i.test(c.href) ? "_blank" : undefined}
                  rel="noreferrer"
                  aria-label={c.label}
                  title={c.label}
                  style={{ "--c": glowOf(c.key), "--d": `${i * 0.45}s` }}
                  className="chan-tile w-16 h-16 rounded-xl border border-line bg-panel hover:border-white/30 hover:-translate-y-1 transition-all flex items-center justify-center"
                >
                  <span className="chan-ring" />
                  <span className="chan-logo"><BrandLogo name={c.key} size={30} /></span>
                  {c.key === "whatsapp" && <span className="chan-dot" />}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line pt-16 pb-8 bg-gradient-to-b from-brand/[0.06] to-transparent">
        <div className="container-x">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
            <div>
              <div className="flex items-center gap-2 font-display font-bold text-lg mb-4">
                <Logo src={s.logo} className="h-8" />
                {first} <span className="text-brand">{rest.join(" ")}</span>
              </div>
              <p className="text-mist text-xs leading-relaxed">{s.footerAbout}</p>
              {socials.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-5">
                  {socials.map(({ href, key, label }, i) => {
                    // x, tiktok and threads draw white (they have no real brand colour of their own) - a
                    // fixed dark badge keeps them visible in light theme too, instead of white-on-white.
                    const mono = key === "x" || key === "tiktok" || key === "threads";
                    return (
                      <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} style={{ "--c": glowOf(key), "--d": `${i * 0.3}s` }} className={`chan-tile w-9 h-9 rounded-full border hover:-translate-y-0.5 flex items-center justify-center transition-all ${mono ? "bg-[#111114] border-white/15 hover:border-white/30" : "bg-panel border-line hover:border-white/30"}`}>
                        <span className="chan-logo"><BrandLogo name={key} size={16} /></span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {cols.map((c) => (
              <div key={c.title}>
                <p className="font-semibold text-sm mb-5">{c.title}</p>
                <div className="flex flex-col text-xs text-mist">
                  {c.links.map(([l, h]) => <a key={l} href={h} className="py-2 lg:py-1.5 hover:text-fg transition-colors">{l}</a>)}
                </div>
              </div>
            ))}

            <div>
              <p className="font-semibold text-sm mb-5">Contact Us</p>
              <div className="space-y-4 text-xs text-mist">
                <p className="flex gap-3"><MapPin size={15} className="text-brand shrink-0" /> {s.address}</p>
                <p className="flex gap-3"><Phone size={15} className="text-brand shrink-0" /> {s.phone}</p>
                {channels.find((c) => c.key === "whatsapp") && (
                  <a href={channels.find((c) => c.key === "whatsapp").href} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-fg transition-colors"><Phone size={15} className="text-emerald-400 shrink-0" /> {s.waFooterLabel}: {channels.find((c) => c.key === "whatsapp").sub}</a>
                )}
                <p className="flex gap-3"><Mail size={15} className="text-brand shrink-0" /> {s.contactEmail}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-mist mr-2">Pay with</span>
            {getPaymentOptions(s).map((o) => (
              <span key={o.name} title={o.name} className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-white/95 text-[11px] font-bold text-[#1c1c28]">
                {o.logo ? <img src={o.logo} alt={o.name} loading="lazy" className="h-5 w-auto max-w-[84px] object-contain" /> : o.name}
              </span>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-line text-xs text-mist flex flex-col sm:flex-row justify-between gap-3">
            <span className="min-w-0">
              <RichText text={s.footerCopyLine} vars={{ year: dhakaDay(new Date()).slice(0, 4), name: s.siteName }} />
              {s.footerNote && <span className="block mt-1 opacity-80"><RichText text={s.footerNote} vars={{ year: dhakaDay(new Date()).slice(0, 4), name: s.siteName }} /></span>}
            </span>
            <span className="flex flex-wrap gap-x-4 gap-y-1 shrink-0"><a href="/privacy" className="hover:text-fg">{s.footerLinkPrivacy}</a><a href="/terms" className="hover:text-fg">{s.footerLinkTerms}</a><a href="/refund" className="hover:text-fg">{s.footerLinkRefund}</a></span>
          </div>
        </div>
      </footer>
    </>
  );
}
