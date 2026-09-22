import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · HiT Tech Pro",
  robots: { index: false },
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "HiT Admin", statusBarStyle: "black" },
};

export default async function PanelLayout({ children }) {
  const session = getSession();
  if (!session) redirect("/admin/login");
  const s = await getSettings();
  return <AdminShell user={{ name: session.name, email: session.email }} logo={s.logo}>{children}</AdminShell>;
}
