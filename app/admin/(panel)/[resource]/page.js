import { notFound } from "next/navigation";
import ResourceManager from "@/components/admin/ResourceManager";
import { RESOURCES } from "@/lib/resources";

export default function ResourcePage({ params, searchParams }) {
  const res = RESOURCES[params.resource];
  if (!res) notFound();
  return <ResourceManager key={`${params.resource}|${searchParams?.status || ""}|${searchParams?.q || ""}|${searchParams?.edit || ""}|${searchParams?.new || ""}|${searchParams?.t || ""}`} name={params.resource} initialStatus={String(searchParams?.status || "")} initialQ={String(searchParams?.q || "")} initialEdit={String(searchParams?.edit || "")} initialNew={searchParams?.new === "1"} />;
}
