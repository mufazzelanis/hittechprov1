import { Gift } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import ComingSoon from "@/components/ComingSoon";
import OffersGrid from "@/components/OffersGrid";
import Reveal from "@/components/Reveal";
import RichText from "@/components/RichText";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getOffers, isEnded } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  const on = s.freeOffersOn === "true";
  return {
    title: `${on ? s.offersMetaTitle : "Free Offers - Coming soon"} | ${s.siteName}`,
    description: on ? s.offersText : s.offSoonText,
    alternates: { canonical: "/free-offers" },
    robots: on ? undefined : { index: false },
  };
}

export default async function FreeOffersPage() {
  const s = await getSettings();
  if (s.freeOffersOn !== "true")
    return (
      <SiteShell>
        <ComingSoon s={s} variant="offers" />
      </SiteShell>
    );

  // Reward text is deliberately NOT sent to the page; the claim API returns it.
  const offers = (await getOffers())
    .filter((o) => o.active)
    .map(({ reward, created, ...o }) => ({ ...o, ended: isEnded(o) }))
    .sort((a, b) => Number(a.ended) - Number(b.ended));

  const uid = getUserId();
  const user = uid ? await prisma.user.findUnique({ where: { id: uid }, select: { name: true, email: true, phone: true } }) : null;
  const t = {
    empty: s.offersEmpty, claim: s.offersClaimBtn, soldOut: s.offersSoldOut, ended: s.offersEnded, left: s.offersLeft, ends: s.offersEnds,
    claimTitle: s.offersClaimTitle, formNote: s.offersFormNote, fName: s.offersFName, fEmail: s.offersFEmail, fPhone: s.offersFPhone, submit: s.offersSubmit,
    successTitle: s.offersSuccessTitle, yourOffer: s.offersYourOffer, noReward: s.offersNoReward, noRewardMail: s.offersNoRewardMail, contactBtn: s.offersContactBtn, alreadyClaimed: s.offersAlready,
    endsIn: s.offersEndsIn, claimedCount: s.offersClaimedCount, joinClaim: s.offersJoinClaim, joinNote: s.offersJoinNote, step1: s.offersStep1, step2: s.offersStep2,
    joinBtn: s.offersJoinBtn, checking: s.offersChecking, joined: s.offersJoined, locked: s.offersLocked, fHandle: s.offersFHandle,
    joinLabels: { telegram: s.offersJoinTelegram, whatsapp: s.offersJoinWhatsapp, facebook: s.offersJoinFacebook, instagram: s.offersJoinInstagram, youtube: s.offersJoinYoutube, other: s.offersJoinOther },
    open: s.offersOpen, copy: s.offersCopy, copied: s.offersCopied, close: s.offersClose,
  };

  return (
    <SiteShell>
      <section className="relative pt-32 pb-24 bg-grain overflow-hidden">
        <div className="orb absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-brand/15 blur-[110px] pointer-events-none" />
        <div className="container-x max-w-6xl relative">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-brand/40 text-brand bg-brand/10 mb-5"><Gift size={13} /> {s.offersBadge}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold"><RichText text={s.offersTitle} /></h1>
            <p className="text-mist mt-4 leading-relaxed">{s.offersText}</p>
          </Reveal>
          <OffersGrid offers={offers} t={t} user={user} />
        </div>
      </section>
    </SiteShell>
  );
}
