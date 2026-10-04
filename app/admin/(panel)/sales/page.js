import SalesReport from "@/components/admin/SalesReport";
import { requirePage } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sales report · HiT Admin" };

export default async function SalesPage({ searchParams }) {
  const admin = await requirePage("sales.view");
  return <SalesReport key={String(searchParams?.preset || "") + String(searchParams?.t || "")} initialPreset={String(searchParams?.preset || "")} />;
}
