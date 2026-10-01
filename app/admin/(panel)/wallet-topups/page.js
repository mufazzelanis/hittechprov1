import ResourceManager from "@/components/admin/ResourceManager";

export const dynamic = "force-dynamic";

// A dedicated route (not the generic [resource] one) because the resource key ("walletTopups") is
// camelCase but the URL is kebab-case ("wallet-topups") - the generic route does a direct
// RESOURCES[params.resource] lookup with no case conversion, so it 404s on any multi-word resource whose
// key doesn't literally match its URL segment (see also /admin/smm-services for the same reason).
export default function WalletTopupsAdminPage({ searchParams }) {
  return (
    <ResourceManager
      key={`walletTopups|${searchParams?.status || ""}|${searchParams?.q || ""}|${searchParams?.edit || ""}|${searchParams?.new || ""}|${searchParams?.t || ""}`}
      name="walletTopups"
      initialStatus={String(searchParams?.status || "")}
      initialQ={String(searchParams?.q || "")}
      initialEdit={String(searchParams?.edit || "")}
      initialNew={searchParams?.new === "1"}
    />
  );
}
