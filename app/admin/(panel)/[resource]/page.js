import { notFound } from "next/navigation";
import ResourceManager from "@/components/admin/ResourceManager";
import { RESOURCES, resourcePerm } from "@/lib/resources";
import { requirePage, hasPerm } from "@/lib/adminAuth";

export default async function ResourcePage({ params, searchParams }) {
  const res = RESOURCES[params.resource];
  if (!res) notFound();
  const admin = await requirePage(resourcePerm(params.resource, "view"));
  const canManage = hasPerm(admin, resourcePerm(params.resource, "manage"));
  return <ResourceManager key={`${params.resource}|${searchParams?.status || ""}|${searchParams?.q || ""}|${searchParams?.edit || ""}|${searchParams?.new || ""}|${searchParams?.t || ""}`} name={params.resource} canManage={canManage} canCreateOrder={hasPerm(admin, "orders.create")} seeMoney={hasPerm(admin, "sales.view")} initialStatus={String(searchParams?.status || "")} initialQ={String(searchParams?.q || "")} initialEdit={String(searchParams?.edit || "")} initialNew={searchParams?.new === "1" && canManage} />;
}
