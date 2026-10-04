import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdmin } from "@/lib/adminAuth";
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
  // Re-checked against the database on every page: suspended / removed / signed-out admins are out at once.
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const s = await getSettings();
  // Read the sidebar state on the server so a collapsed sidebar does not flash open on load.
  const collapsed = cookies().get("admin_sb")?.value === "1";
  return (
    <AdminShell user={{ name: admin.name, email: admin.email, role: admin.role }} perms={admin.perms} logo={s.logo} initialCollapsed={collapsed}>
      {children}
    </AdminShell>
  );
}
