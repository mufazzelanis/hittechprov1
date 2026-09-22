import { redirect } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import AuthForm from "@/components/account/AuthForm";
import { getUserId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in — HiT Tech Pro", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }) {
  const s = await getSettings();
  const n = searchParams?.next;
  const next = typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/account";
  if (getUserId()) redirect(next);
  return (
    <SiteShell>
      <div className="min-h-[80vh] bg-grain px-5 pt-32 pb-20">
        <AuthForm affiliate={s.affiliateOn === "true"} next={next} initialMode={searchParams?.mode === "register" ? "register" : "login"} />
      </div>
    </SiteShell>
  );
}
