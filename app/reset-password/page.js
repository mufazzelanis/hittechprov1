import { Suspense } from "react";
import SiteShell from "@/components/SiteShell";
import { ResetPasswordCard } from "@/components/account/PasswordReset";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset password — HiT Tech Pro", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <SiteShell>
      <div className="min-h-[80vh] bg-grain px-5 pt-32 pb-20">
        <Suspense fallback={null}>
          <ResetPasswordCard signInHref="/login" forgotHref="/forgot-password" />
        </Suspense>
      </div>
    </SiteShell>
  );
}
