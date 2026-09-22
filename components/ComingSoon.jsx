import Link from "next/link";
import { Rocket, Gift, Coins, Repeat, Zap, Bell, ArrowUpRight, Store, Tag, Sparkles, BadgeCheck, Wand2, MessageSquareText, Image as ImageIcon } from "lucide-react";
import Reveal from "./Reveal";
import RichText from "./RichText";
import LeadButton from "./LeadModal";
import { parseShops } from "@/lib/shops";

// "Coming soon" page shown while a section is switched off in Admin.
//   variant "affiliate": Admin -> Affiliates      variant "offers": Admin -> Free Offers      variant "prompts": Admin -> AI Prompt Vault
const VARIANTS = {
  affiliate: { p: "affSoon", Icon: Rocket, lead: "affiliate", points: [Coins, Repeat, Zap] },
  offers: { p: "offSoon", Icon: Gift, lead: "offer-notify", points: [Tag, Sparkles, BadgeCheck] },
  prompts: { p: "pvSoon", Icon: Wand2, lead: "prompt-notify", points: [MessageSquareText, ImageIcon, Sparkles] },
};

export default function ComingSoon({ s, variant = "affiliate" }) {
  const v = VARIANTS[variant];
  const k = (n) => s[`${v.p}${n}`];
  const shops = parseShops(s.otherShops);
  const loop = shops.length < 4 ? [...shops, ...shops, ...shops, ...shops] : [...shops, ...shops];
  const points = v.points.map((I, i) => [I, k(`Point${i + 1}`)]);

  return (
    <>
      <section className="relative pt-36 pb-24 text-center overflow-hidden bg-grain">
        <div className="orb absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-brand/20 blur-[110px] pointer-events-none" />
        <div className="orb absolute top-32 right-1/4 w-80 h-80 rounded-full bg-gold/10 blur-[110px] pointer-events-none" style={{ animationDelay: "-6s" }} />
        <div className="container-x max-w-3xl relative">
          <Reveal>
            <span className="floaty mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-brand to-brand-dark shadow-glow flex items-center justify-center mb-7">
              <v.Icon size={34} />
            </span>
            <span className="inline-flex items-center gap-2 text-xs px-4 py-1.5 rounded-full border border-brand/50 text-brand bg-brand/10">
              <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-brand opacity-75 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-brand" /></span>
              {k("Badge")}
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold mt-6 leading-tight"><RichText text={k("Title")} /></h1>
            <p className="text-mist mt-6 leading-relaxed max-w-xl mx-auto">{k("Text")}</p>

            <div className="flex flex-wrap justify-center gap-3 mt-9">
              <LeadButton type={v.lead} className="btn-primary px-6 py-3.5"><Bell size={16} /> {k("NotifyBtn")}</LeadButton>
              <Link href="/tools" className="btn-ghost px-6 py-3.5">{k("BackBtn")}</Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-14 text-left">
              {points.map(([I, t], i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="h-full rounded-2xl border border-line bg-panel/80 backdrop-blur p-5 hover:border-brand/40 hover:-translate-y-1 transition-all">
                    <span className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-3"><I size={18} /></span>
                    <p className="text-sm font-semibold">{t}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {shops.length > 0 && (
        <section className="py-20 border-t border-line bg-panel/40">
          <Reveal className="text-center mb-10 container-x">
            <span className="inline-flex items-center gap-2 text-xs text-brand mb-3"><Store size={14} /> {s.shopsBadge}</span>
            <h2 className="font-display text-3xl font-bold">{s.shopsTitle}</h2>
            <p className="text-mist mt-3 text-sm">{s.shopsSub}</p>
          </Reveal>
          <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
            <div className="marquee-track flex gap-4 w-max" style={{ animationDuration: `${Math.max(30, loop.length * 6)}s` }}>
              {loop.map((sh, i) => (
                <a key={sh.name + i} href={sh.url} target="_blank" rel="noopener noreferrer" className="group w-72 shrink-0 rounded-2xl border border-line bg-panel p-5 hover:border-brand/60 hover:-translate-y-1 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center font-display font-bold">{sh.name[0]}</span>
                    <p className="font-semibold flex-1 truncate">{sh.name}</p>
                    <ArrowUpRight size={16} className="text-mist group-hover:text-brand transition-colors" />
                  </div>
                  {sh.desc && <p className="text-xs text-mist leading-relaxed mt-3 line-clamp-2">{sh.desc}</p>}
                  <p className="text-[11px] text-brand mt-3">{s.shopsVisit}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
