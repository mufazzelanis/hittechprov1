import { getSettings } from "@/lib/settings";
import { getOffers } from "@/lib/offers";
import MasterToggle from "@/components/admin/MasterToggle";
import FreeOffersManager from "@/components/admin/FreeOffersManager";

export const dynamic = "force-dynamic";

export default async function FreeOffersAdminPage() {
  const [s, offers] = await Promise.all([getSettings(), getOffers()]);
  return (
    <div className="space-y-6">
      <MasterToggle
        settingKey="freeOffersOn"
        initial={s.freeOffersOn === "true"}
        name="Free Offers"
        onText="The Free Offers page is live. Visitors can claim the visible offers below."
        offText="Visitors see a 'Coming soon' page. Add your offers below, then switch this on when you are ready to launch."
      />
      <FreeOffersManager initial={offers} />
    </div>
  );
}
