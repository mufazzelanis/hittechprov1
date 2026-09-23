import SiteShell from "@/components/SiteShell";
import { ForgotPasswordCard } from "@/components/account/PasswordReset";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forgot password — HiT Tech Pro", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <SiteShell>
      <div className="min-h-[80vh] bg-grain px-5 pt-32 pb-20">
        <ForgotPasswordCard backHref="/login" />
      </div>
    </SiteShell>
  );
}
