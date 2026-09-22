import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = { title: "Page not found — HiT Tech Pro" };

export default function NotFound() {
  return (
    <SiteShell>
      <div className="min-h-[80vh] flex items-center justify-center px-6 pt-24 bg-grain text-center">
        <div>
          <p className="font-display text-8xl font-bold text-brand floaty">404</p>
          <h1 className="font-display text-2xl font-bold mt-4">This page does not exist</h1>
          <p className="text-mist text-sm mt-2">The link may be broken or the page was moved.</p>
          <div className="flex justify-center gap-3 mt-7">
            <Link href="/" className="btn-primary">Back to home</Link>
            <Link href="/tools" className="btn-ghost">Browse tools</Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
