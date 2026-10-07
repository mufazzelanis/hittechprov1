import CustomerActivity from "@/components/admin/CustomerActivity";
import { requirePage } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer Activity · HiT Admin" };

export default async function CustomersPage() {
  const admin = await requirePage("analytics.view");
  return <CustomerActivity />;
}
