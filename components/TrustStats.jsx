import { ShieldCheck, RefreshCw, BadgeCheck, Shield } from "lucide-react";
import Reveal from "./Reveal";
import RichText from "./RichText";

export default function TrustStats({ s }) {
  const trust = [
    { icon: ShieldCheck, title: s.trust1Title, body: s.trust1Body },
    { icon: RefreshCw, title: s.trust2Title, body: s.trust2Body },
    { icon: BadgeCheck, title: s.trust3Title, body: s.trustNote },
  ];
  return (
    <section className="py-24 border-t border-line">
      <div className="container-x">
        <Reveal className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/[0.08] to-transparent p-8 sm:p-14">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-brand/15 text-brand mb-5">
              <Shield size={12} /> {s.trustBadge}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold"><RichText text={s.trustTitle} /></h2>
            <p className="text-mist mt-4 text-sm leading-relaxed">{s.trustText}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 mt-12">
            {trust.map((t, i) => (
              <Reveal key={i} delay={i * 0.1} className="text-center">
                <span className="w-11 h-11 rounded-full bg-brand/15 text-brand flex items-center justify-center mx-auto mb-4"><t.icon size={19} /></span>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-mist text-xs mt-2 leading-relaxed max-w-xs mx-auto">{t.body}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
