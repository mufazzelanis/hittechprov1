import SiteShell from "@/components/SiteShell";
import CheckoutClient from "@/components/CheckoutClient";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPaymentOptions } from "@/lib/payments";
import { getChannels } from "@/lib/channels";
import { walletBalance } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout — HiT Tech Pro", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  const uid = getUserId();
  const user = uid ? await prisma.user.findUnique({ where: { id: uid }, select: { name: true, email: true, phone: true } }) : null;
  const wallet = uid ? await walletBalance(uid) : 0;

  return (
    <SiteShell>
      <div className="container-x max-w-6xl pt-28 pb-24">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">{s.checkoutTitle}</h1>
        <p className="text-mist text-sm mb-8">{s.checkoutSub}</p>
        <CheckoutClient
          options={getPaymentOptions(s)}
          usd={{ rate: parseFloat(s.usdRate) || 0, currency: s.usdCurrency || "USDT" }}
          payoneer={s.payoneerOn === "true" ? { label: s.payoneerLabel || "Card / Payoneer (USD)", instructions: s.payoneerInstructions } : null}
          user={user}
          wallet={wallet}
          wa={{ help: s.waHelpMsg, order: s.waOrderMsg, orderBtn: s.waOrderBtn, note: s.waOrderNote }}
          contact={{ email: s.contactEmail, channels: getChannels(s).filter((c) => c.key !== "email") }}
        />
      </div>
    </SiteShell>
  );
}
