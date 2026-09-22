import Nav from "./Nav";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import ScrollProgress from "./ScrollProgress";
import MobileTabBar from "./MobileTabBar";
import SoonPopup from "./SoonPopup";
import ToolQuickView from "./ToolQuickView";
import TrustPop from "./TrustPop";
import { waChannel } from "@/lib/wa";
import RefCapture from "./RefCapture";
import { getSettings } from "@/lib/settings";
import { getChannels } from "@/lib/channels";

// Shared frame (nav, footer, chat, checkout modal) for every public page.
export default async function SiteShell({ children }) {
  const s = await getSettings();
  return (
    <div className="max-xl:pb-[calc(3.75rem+env(safe-area-inset-bottom))]">
      <RefCapture enabled={s.affiliateOn === "true"} />
      <ScrollProgress />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:bg-brand focus:px-4 focus:py-2 focus:rounded-lg">Skip to content</a>
      <Nav name={s.siteName} logo={s.logo} affiliate={s.affiliateOn === "true"} offers={s.freeOffersOn === "true"} prompts={s.promptVaultOn === "true"} />
      <main id="main">{children}</main>
      <Footer s={s} />
      <ChatWidget
        channels={getChannels(s)}
        t={{
          greeting: s.chatGreeting, online: s.chatOnline, reply: s.chatReply, topicsLabel: s.chatTopicsLabel, fastTag: s.chatFastTag, browse: s.chatBrowse,
          topics: [1, 2, 3].map((n) => ({ label: s["chatTopic" + n], msg: s["chatTopic" + n + "Msg"] })),
        }}
      />
      <MobileTabBar />
      <TrustPop enabled={s.salesPopOn !== "false"} minSec={parseInt(s.salesPopMinSec, 10) || 10} maxSec={parseInt(s.salesPopMaxSec, 10) || 30} />
      <ToolQuickView t={{ included: s.qvIncluded, perks: s.qvPerks, add: s.qvAdd, added: s.qvAdded, goBasket: s.qvGoBasket, buy: s.qvBuy, full: s.qvFull, trust: s.qvTrust, soonBtn: s.soonBtn, soonBadge: s.soonBadge }} />
      <SoonPopup
        wa={waChannel(getChannels(s))}
        t={{ title: s.soonTitle, text: s.soonText, fName: s.soonFName, fEmail: s.soonFEmail, notify: s.soonNotify, thanks: s.soonThanks, waBtn: s.soonWaBtn, waMsg: s.soonWaMsg }}
      />
    </div>
  );
}
