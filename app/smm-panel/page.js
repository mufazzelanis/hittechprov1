import { Share2, Layers, Zap, ShieldCheck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import ComingSoon from "@/components/ComingSoon";
import SmmPanelClient from "@/components/SmmPanelClient";
import Reveal from "@/components/Reveal";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  const on = s.smmPanelOn === "true";
  return {
    title: `${on ? "SMM Panel - Boost your social media" : "SMM Panel - Coming soon"} | ${s.siteName}`,
    description: on ? "Buy Facebook, Instagram, YouTube and TikTok followers, likes and views at wholesale prices." : "SMM Panel is launching soon.",
    alternates: { canonical: "/smm-panel" },
    robots: on ? undefined : { index: false },
  };
}

export default async function SmmPanelPage() {
  const s = await getSettings();
  if (s.smmPanelOn !== "true")
    return (
      <SiteShell>
        <ComingSoon s={s} variant="smm" />
      </SiteShell>
    );

  let services = [];
  try {
    services = await prisma.smmService.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sort: "asc" }],
      select: { id: true, name: true, category: true, type: true, sellRate: true, min: true, max: true, refill: true, cancel: true },
    });
  } catch {}

  const categoryCount = new Set(services.map((s) => s.category)).size;
  const stats = [
    { Icon: Layers, v: services.length.toLocaleString() + "+", l: "Services" },
    { Icon: Share2, v: categoryCount.toLocaleString(), l: "Platforms" },
    { Icon: Zap, v: "Instant", l: "Order start" },
    { Icon: ShieldCheck, v: "Tracked", l: "Every order" },
  ];

  return (
    <SiteShell>
      <section className="relative pt-32 pb-8 bg-grain overflow-hidden">
        <div className="orb absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-brand/15 blur-[110px] pointer-events-none" />
        <div className="orb absolute top-20 right-0 w-80 h-80 rounded-full bg-gold/10 blur-[110px] pointer-events-none" style={{ animationDelay: "-6s" }} />
        <div className="container-x max-w-6xl relative">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-brand/40 text-brand bg-brand/10 mb-5">
              <Share2 size={13} /> SMM Panel
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold">Grow your social media, instantly</h1>
            <p className="text-mist mt-4 leading-relaxed">Followers, likes, views and more — wholesale prices, real automatic delivery.</p>
          </Reveal>

          {services.length > 0 && (
            <Reveal delay={0.1} className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {stats.map(({ Icon, v, l }) => (
                <div key={l} className="rounded-xl border border-line bg-panel/70 backdrop-blur px-3 py-3.5 text-center">
                  <Icon size={16} className="mx-auto text-brand mb-1.5" />
                  <p className="font-display font-bold text-lg leading-none">{v}</p>
                  <p className="text-[11px] text-mist mt-1">{l}</p>
                </div>
              ))}
            </Reveal>
          )}
        </div>
      </section>
      <SmmPanelClient services={services} />
    </SiteShell>
  );
}
