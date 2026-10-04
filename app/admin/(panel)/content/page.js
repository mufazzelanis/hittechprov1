import ContentForm from "@/components/admin/ContentForm";
import { getSettings } from "@/lib/settings";
import { requirePage } from "@/lib/adminAuth";

export default async function ContentPage({ searchParams }) {
  const admin = await requirePage("content.view");
  const settings = await getSettings(); // secrets are never sent to the browser
  return <ContentForm initial={settings} initialPage={String(searchParams?.page || "")} focus={String(searchParams?.focus || "")} nonce={String(searchParams?.t || "")} />;
}
