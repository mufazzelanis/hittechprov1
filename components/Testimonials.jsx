import { Star } from "lucide-react";
import Reveal from "./Reveal";
import RichText from "./RichText";

const AVATAR = ["#E8352B", "#2563EB", "#7C3AED", "#0D9488", "#EA580C", "#DB2777"];

function Card({ r }) {
  const c = AVATAR[r.name.length % AVATAR.length];
  return (
    <div className="w-72 shrink-0 rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: c + "33", color: c }}>{r.name[0]}</span>
        <div>
          <p className="font-semibold text-sm leading-tight">{r.name}</p>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
          </div>
        </div>
      </div>
      <p className="text-xs text-mist italic leading-relaxed mt-3 line-clamp-4">"{r.text}"</p>
    </div>
  );
}

function Row({ title, dot, items }) {
  if (!items.length) return null;
  // duplicated so the -50% translate loops seamlessly
  const loop = items.length < 5 ? [...items, ...items, ...items, ...items] : [...items, ...items];
  return (
    <div className="mb-10">
      <h3 className="flex items-center gap-2 font-semibold mb-4 container-x"><span className="w-3 h-3 rounded-sm" style={{ background: dot }} /> {title}</h3>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="marquee-track flex gap-4 w-max">
          {loop.map((r, i) => <Card key={r.id + "-" + i} r={r} />)}
        </div>
      </div>
    </div>
  );
}

export default function Testimonials({ reviews, s }) {
  return (
    <section id="reviews" className="py-24 border-t border-line">
      <Reveal className="text-center mb-14 container-x">
        <h2 className="font-display text-3xl sm:text-4xl font-bold"><RichText text={s.reviewsTitle} /></h2>
        <p className="text-mist mt-3 text-sm">{s.reviewsSubtitle}</p>
      </Reveal>
      <Row title={s.reviewsFbTitle} dot="#2563EB" items={reviews.filter((r) => r.source === "facebook")} />
      <Row title={s.reviewsTpTitle} dot="#00B67A" items={reviews.filter((r) => r.source === "trustpilot")} />
    </section>
  );
}
