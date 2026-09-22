import { getSettings } from "@/lib/settings";
import MasterToggle from "@/components/admin/MasterToggle";
import ResourceManager from "@/components/admin/ResourceManager";

export const dynamic = "force-dynamic";

// A dedicated route (not the generic [resource] one) so the on/off switch can sit above the list,
// the same pattern as Admin -> Free Offers.
export default async function PromptVaultAdminPage({ searchParams }) {
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <MasterToggle
        settingKey="promptVaultOn"
        initial={s.promptVaultOn === "true"}
        name="AI Prompt Vault"
        onText="The AI Prompt Vault page is live. Visitors see the prompts you mark Visible below."
        offText="Visitors see a 'Coming soon' page. Add your prompts below, then switch this on when you are ready to launch."
      />
      <ResourceManager
        key={`prompts|${searchParams?.q || ""}|${searchParams?.edit || ""}|${searchParams?.new || ""}|${searchParams?.t || ""}`}
        name="prompts"
        initialQ={String(searchParams?.q || "")}
        initialEdit={String(searchParams?.edit || "")}
        initialNew={searchParams?.new === "1"}
      />
    </div>
  );
}
