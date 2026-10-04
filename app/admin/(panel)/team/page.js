import TeamAdmin from "@/components/admin/TeamAdmin";
import { requirePage } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await requirePage("team.view");
  return <TeamAdmin />;
}
