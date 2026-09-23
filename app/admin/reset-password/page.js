"use client";

import { Suspense } from "react";
import { ResetPasswordCard } from "@/components/account/PasswordReset";

export default function AdminResetPasswordPage() {
  return (
    <main className="min-h-dvh bg-ink bg-grain flex items-center justify-center px-5 py-10">
      <Suspense fallback={null}>
        <ResetPasswordCard signInHref="/admin/login" forgotHref="/admin/forgot-password" />
      </Suspense>
    </main>
  );
}
