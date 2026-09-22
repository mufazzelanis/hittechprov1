import { Wand2 } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import ComingSoon from "@/components/ComingSoon";
import PromptVaultGrid from "@/components/PromptVaultGrid";
import Reveal from "@/components/Reveal";
import RichText from "@/components/RichText";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  const on = s.promptVaultOn === "true";
  return {
    title: `${on ? s.pvMetaTitle : "AI Prompt Vault - Coming soon"} | ${s.siteName}`,
    description: on ? s.pvText : s.pvSoonText,
    alternates: { canonical: "/prompts" },
    robots: on ? undefined : { index: false },
  };
}

export default async function PromptVaultPage() {
  const s = await getSettings();
  if (s.promptVaultOn !== "true")
    return (
      <SiteShell>
        <ComingSoon s={s} variant="prompts" />
      </SiteShell>
    );

  let prompts = [];
  try {
    prompts = await prisma.prompt.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });
  } catch {}

  const t = {
    searchPlaceholder: s.pvSearchPlaceholder, allChip: s.pvAllChip, empty: s.pvEmpty,
    viewBtn: s.pvViewBtn, newTag: s.pvNewTag, useWith: s.pvUseWith,
    copyBtn: s.pvCopyBtn, copiedBtn: s.pvCopiedBtn, closeBtn: s.pvCloseBtn,
  };

  return (
    <SiteShell>
      <section className="relative pt-32 pb-8 bg-grain overflow-hidden">
        <div className="orb absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-brand/15 blur-[110px] pointer-events-none" />
        <div className="container-x max-w-6xl relative">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-brand/40 text-brand bg-brand/10 mb-5"><Wand2 size={13} /> {s.pvBadge}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold"><RichText text={s.pvTitle} /></h1>
            <p className="text-mist mt-4 leading-relaxed">{s.pvText}</p>
          </Reveal>
        </div>
      </section>
      <PromptVaultGrid prompts={prompts} t={t} />
    </SiteShell>
  );
}
