import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { requirePage } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · HiT Admin" };

export default async function AnalyticsPage() {
  const admin = await requirePage("analytics.view");
  return <AnalyticsDashboard />;
}
