"use client";

import { ForgotPasswordCard } from "@/components/account/PasswordReset";

export default function AdminForgotPasswordPage() {
  return (
    <main className="min-h-dvh bg-ink bg-grain flex items-center justify-center px-5 py-10">
      <ForgotPasswordCard admin backHref="/admin/login" />
    </main>
  );
}
