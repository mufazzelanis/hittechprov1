import SalesReport from "@/components/admin/SalesReport";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sales report · HiT Admin" };

export default function SalesPage({ searchParams }) {
  return <SalesReport key={String(searchParams?.preset || "") + String(searchParams?.t || "")} initialPreset={String(searchParams?.preset || "")} />;
}
