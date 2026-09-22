import { DollarSign, Users, TrendingUp, Gift, Star, ArrowRight, Target, Handshake, Share2, Wallet, TrendingUp as Up } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import ComingSoon from "@/components/ComingSoon";
import Reveal from "@/components/Reveal";
import RichText from "@/components/RichText";
import Link from "next/link";
import AffiliateChart from "@/components/AffiliateChart";
import FAQ from "@/components/FAQ";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const s = await getSettings();
  const on = s.affiliateOn === "true";
  return { title: `${on ? "Affiliate Program" : "Affiliate Program - Coming soon"} | ${s.siteName}`, alternates: { canonical: "/affiliate" }, robots: on ? undefined : { index: false } };
}

const faqs = [
  { id: "a1", question: "How much commission can I earn?", answer: "Commission is a percentage of every sale you refer. The rate depends on your performance tier, up to the maximum shown above." },
  { id: "a2", question: "When do I get paid?", answer: "Once your approved balance reaches the minimum payout, you can request a withdrawal and we process it to your bKash, Nagad or bank account." },
  { id: "a3", question: "Can I promote on social media?", answer: "Yes. Facebook groups, YouTube, blogs and Telegram are all fine. Spam and misleading claims are not allowed." },
];

export default async function AffiliatePage() {
  const s = await getSettings();
  if (s.affiliateOn !== "true") return <SiteShell><ComingSoon s={s} /></SiteShell>;
  const fill = (x) => String(x).split("{commission}").join(s.affCommission);
  const stats = [[`${s.affCommission}%`, "Max Commission"], [s.affCookieDays, "Cookie Days"], [`৳${s.affMinPayout}`, "Min Payout"], ["24/7", "Support"]];
  const why = [
    { i: DollarSign, t: s.affB1Title, b: fill(s.affB1Body), c: "text-emerald-400 bg-emerald-500/10" },
    { i: Users, t: s.affB2Title, b: fill(s.affB2Body), c: "text-blue-400 bg-blue-500/10" },
    { i: TrendingUp, t: s.affB3Title, b: fill(s.affB3Body), c: "text-purple-400 bg-purple-500/10" },
    { i: Gift, t: s.affB4Title, b: fill(s.affB4Body), c: "text-brand bg-brand/10" },
  ];
  const cats = [["SEO Tools", "2,400"], ["Design Tools", "1,800"], ["Marketing Tools", "1,200"], ["Analytics Tools", "900"]];
  const steps = [
    [Target, s.affStep1Title, s.affStep1Body],
    [Handshake, s.affStep2Title, s.affStep2Body],
    [Share2, s.affStep3Title, s.affStep3Body],
    [Wallet, s.affStep4Title, s.affStep4Body],
  ];

  return (
    <SiteShell>
      <section className="relative pt-32 pb-24 text-center overflow-hidden bg-grain">
        <div className="container-x max-w-3xl relative">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-brand/50 text-brand"><Star size={11} /> {s.affBadge}</span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold mt-6 leading-tight"><RichText text={s.affTitle} /></h1>
            <p className="text-mist mt-6 leading-relaxed"><RichText text={s.affText} vars={{ commission: s.affCommission }} /></p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link href="/login?mode=register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand hover:bg-brand-dark font-semibold text-sm shadow-glow">{s.affBtnJoin} <ArrowRight size={14} /></Link>
              <a href="#analytics" className="px-6 py-3 rounded-lg border border-line bg-panel hover:border-mist font-semibold text-sm">{s.affBtnRates}</a>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-14">
            {stats.map(([v, l]) => (
              <Reveal key={l}><p className="font-display font-bold text-3xl text-brand">{v}</p><p className="text-xs text-mist mt-1">{l}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-line">
        <div className="container-x">
          <Reveal className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">{s.affWhyTitle}</h2>
            <p className="text-mist mt-3 text-sm">{s.affWhySub}</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {why.map((w, i) => (
              <Reveal key={w.t} delay={i * 0.08}>
                <div className="h-full rounded-xl border border-line bg-panel p-5 hover:border-brand/40 hover:-translate-y-1 transition-all">
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center mb-5 ${w.c}`}><w.i size={18} /></span>
                  <h3 className="font-semibold text-sm">{w.t}</h3>
                  <p className="text-mist text-xs mt-3 leading-relaxed">{w.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="analytics" className="py-24 bg-panel2/60 border-t border-line">
        <div className="container-x">
          <Reveal className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold">{s.affAnalyticsTitle}</h2>
            <p className="text-mist mt-3 text-sm">{s.affAnalyticsSub}</p>
            <p className="text-[11px] text-mist/60 mt-2">{s.affExampleNote}</p>
          </Reveal>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-line bg-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div><h3 className="font-semibold flex items-center gap-2"><Up size={15} className="text-brand" /> Monthly Revenue Growth</h3><p className="text-xs text-mist mt-1">How top affiliates scale earnings month over month</p></div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300">+340% Growth</span>
              </div>
              <AffiliateChart />
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[["৳1,200", "This Month", "text-emerald-400 border-emerald-500/30"], ["78", "Referrals", "text-blue-400 border-blue-500/30"], ["৳19", "Avg Per Sale", "text-purple-400 border-purple-500/30"]].map(([v, l, c]) => (
                  <div key={l} className={`rounded-lg border bg-ink/40 p-3 text-center ${c}`}><p className="font-display font-bold text-lg">{v}</p><p className="text-[11px] text-mist">{l}</p></div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-6">
              <h3 className="font-semibold mb-4">Commission Breakdown</h3>
              <p className="font-display font-bold text-4xl text-brand text-center">{s.affRate}%<span className="block text-xs text-mist font-normal mt-1">Base commission</span></p>
              <div className="space-y-3 mt-6">
                {[["Tools Sales", "bg-red-500"], ["Subscriptions", "bg-orange-500"], ["Renewals", "bg-yellow-500"]].map(([l, c]) => (
                  <div key={l} className="flex items-center justify-between rounded-lg bg-panel2 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${c}`} /> {l}</span>
                    <span className="text-brand font-bold">{s.affRate}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                <p className="font-semibold flex items-center gap-1.5 mb-1"><Star size={12} /> Success Story</p>
                "I earned my first payout in the first month just by sharing with my network!"
              </div>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 mt-8" />
          <div className="rounded-2xl border border-line bg-panel p-6 mt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-5"><Up size={15} className="text-brand" /> Top Performing Categories</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cats.map(([n, v], i) => (
                <div key={n} className="relative rounded-lg border border-brand/30 bg-brand/[0.06] p-4">
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  <p className="font-semibold text-sm">{n}</p><p className="text-[11px] text-mist">Monthly Performance</p>
                  <p className="font-display font-bold text-xl text-brand mt-3">৳{v}</p><p className="text-[11px] text-mist">Average Earnings</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-line">
        <div className="container-x">
          <Reveal className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold">{s.affHowTitle}</h2>
            <p className="text-mist mt-3 text-sm">{s.affHowSub}</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(([I, t, b], i) => (
              <Reveal key={t} delay={i * 0.1} className="text-center relative">
                <span className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center mx-auto shadow-glow"><I size={22} /></span>
                <span className="absolute top-0 left-1/2 ml-6 w-6 h-6 rounded-full bg-panel2 border border-line text-[10px] font-bold flex items-center justify-center">0{i + 1}</span>
                <h3 className="font-semibold mt-5">{t}</h3>
                <p className="text-mist text-xs mt-2 leading-relaxed max-w-[200px] mx-auto">{b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-panel2/60"><FAQ faqs={faqs} s={s} /></div>

      <section className="py-20 text-center bg-gradient-to-r from-red-600 to-orange-500">
        <Reveal className="container-x max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-white">{s.affCtaTitle}</h2>
          <p className="mt-3 text-white/90 text-sm">{s.affCtaText}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <Link href="/login?mode=register" className="px-6 py-2.5 rounded-lg bg-white text-brand font-semibold text-sm">{s.affCtaBtn1}</Link>
            <a href="#contact" className="px-6 py-2.5 rounded-lg bg-ink border border-white/30 font-semibold text-sm text-white">{s.affCtaBtn2}</a>
          </div>
        </Reveal>
      </section>
    </SiteShell>
  );
}
