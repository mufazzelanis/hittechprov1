import Link from "next/link";
import { fmtUsd, fmtTaka } from "@/lib/catalog";
import FitImage from "./FitImage";

// One template/service tile. `usd` is the $ price (null when no dollar price is available).
export default function StoreCard({ href, name, kind, tagline, image, usd, taka, from = false, featured = false }) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-panel overflow-hidden hover:border-brand/50 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 flex flex-col">
      <div className="relative aspect-square bg-panel2 overflow-hidden">
        {image
          ? <FitImage src={image} alt={name} className="w-full h-full" imgClassName="transition-transform duration-500 group-hover:scale-[1.04]" />
          : <div className="w-full h-full flex items-center justify-center font-display text-5xl font-bold text-white bg-gradient-to-br from-brand to-brand-dark">{name.charAt(0)}</div>}
        {featured && <span className="absolute top-3 left-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">Bestseller</span>}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{kind}</p>
        <h3 className="font-display font-semibold mt-1 leading-snug line-clamp-2">{name}</h3>
        {tagline && <p className="text-xs text-mist mt-1 line-clamp-2">{tagline}</p>}
        <div className="mt-auto pt-3 flex items-baseline gap-2">
          {from && <span className="text-xs text-mist">From</span>}
          <span className="font-display text-lg font-bold">{usd != null ? fmtUsd(usd) : fmtTaka(taka)}</span>
          {usd != null && <span className="text-xs text-mist">{fmtTaka(taka)}</span>}
        </div>
      </div>
    </Link>
  );
}
