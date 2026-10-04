import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/settings";
import { SETTING_DEFAULTS } from "@/lib/settingsDefaults";
import { requirePage, hasPerm } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }) {
  const admin = await requirePage("settings.view");
  const settings = await getSettings({ withSecrets: true });
  return <SettingsForm initial={settings} defaults={SETTING_DEFAULTS} canManage={hasPerm(admin, "settings.manage")} initialTab={String(searchParams?.tab || "")} focus={String(searchParams?.focus || "")} nonce={String(searchParams?.t || "")} />;
}
