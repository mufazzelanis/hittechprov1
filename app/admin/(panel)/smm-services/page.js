import { getSettings } from "@/lib/settings";
import MasterToggle from "@/components/admin/MasterToggle";
import SmmSyncPanel from "@/components/admin/SmmSyncPanel";
import SmmApiKeyCard from "@/components/admin/SmmApiKeyCard";
import ResourceManager from "@/components/admin/ResourceManager";
import { requirePage, hasPerm } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Same pattern as Admin -> Free Offers / AI Prompt Vault: a dedicated route (not the generic
// [resource] one) so the on/off switch and the SMMIU sync/balance panel can sit above the services list.
export default async function SmmServicesAdminPage({ searchParams }) {
  const admin = await requirePage("growth.view");
  const s = await getSettings({ withSecrets: true });
  return (
    <div className="space-y-6">
      <MasterToggle
        settingKey="smmPanelOn"
        initial={s.smmPanelOn === "true"}
        name="SMM Panel"
        onText="The SMM Panel page is live. Visitors can order any service you mark Visible below."
        offText="Visitors see a 'Coming soon' page. Sync and price your services below, then switch this on when you are ready to launch."
      />
      <SmmApiKeyCard initial={s.smmiuApiKey} />
      <SmmSyncPanel />
      <ResourceManager
        canManage={hasPerm(admin, "growth.manage")}
        key={`smmServices|${searchParams?.q || ""}|${searchParams?.edit || ""}|${searchParams?.new || ""}|${searchParams?.t || ""}`}
        name="smmServices"
        initialQ={String(searchParams?.q || "")}
        initialEdit={String(searchParams?.edit || "")}
        initialNew={searchParams?.new === "1"}
      />
    </div>
  );
}
