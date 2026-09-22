import { Phone, Mail } from "lucide-react";
import { SiTiktok, SiPinterest, SiThreads, SiDiscord, SiSnapchat, SiReddit } from "react-icons/si";

// Official-style brand logos as inline SVG (no network, crisp at any size).
//   mono  = draws in currentColor (white on a coloured badge)
//   !mono = draws in the brand's own colour (on dark tiles)
// x, tiktok and threads have an officially black/white mark with no real "brand colour" of their own -
// white is used so the icon stays visible on this site's dark tiles, matching how x already worked.
export const LOGO_COLOR = {
  whatsapp: "#25D366",
  telegram: "#229ED9",
  messenger: "#0A7CFF",
  instagram: "#E4405F",
  facebook: "#1877F2",
  youtube: "#FF0000",
  x: "#FFFFFF",
  linkedin: "#0A66C2",
  tiktok: "#FFFFFF",
  pinterest: "#E60023",
  threads: "#FFFFFF",
  discord: "#5865F2",
  snapchat: "#FFFC00",
  reddit: "#FF4500",
  phone: "#E8352B",
  email: "#B8BECC",
};

// Platforms drawn via react-icons/simple-icons instead of a hand-written path (added later than the
// original set above; same currentColor-by-default behaviour, so mono/coloured both work unchanged).
const REACT_ICONS = { tiktok: SiTiktok, pinterest: SiPinterest, threads: SiThreads, discord: SiDiscord, snapchat: SiSnapchat, reddit: SiReddit };

const PATH = {
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  telegram:
    "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  messenger:
    "M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.49-.007l4.362-3.008a.7.7 0 0 1 .365-.13",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

export default function BrandLogo({ name, size = 24, mono = false, className = "" }) {
  if (name === "phone") return <Phone size={size} strokeWidth={2.2} className={className} style={mono ? undefined : { color: LOGO_COLOR.phone }} />;
  if (name === "email") return <Mail size={size} strokeWidth={2.2} className={className} style={mono ? undefined : { color: LOGO_COLOR.email }} />;

  const Icon = REACT_ICONS[name];
  if (Icon) return <Icon size={size} aria-hidden className={className} style={mono ? undefined : { color: LOGO_COLOR[name] }} />;

  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, className };
  const fill = mono ? "currentColor" : LOGO_COLOR[name];

  if (name === "instagram") {
    const stroke = mono ? "currentColor" : "url(#bl-ig)";
    return (
      <svg {...common} fill="none">
        {!mono && (
          <defs>
            <linearGradient id="bl-ig" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FEDA75" /><stop offset="0.35" stopColor="#FA7E1E" /><stop offset="0.65" stopColor="#D62976" /><stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
        )}
        <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.6" stroke={stroke} strokeWidth="2.1" />
        <circle cx="12" cy="12" r="4.5" stroke={stroke} strokeWidth="2.1" />
        <circle cx="17.5" cy="6.5" r="1.3" fill={mono ? "currentColor" : "#D62976"} />
      </svg>
    );
  }
  if (name === "youtube") {
    return (
      <svg {...common}>
        <path fill={fill} d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z" />
        <path fill={mono ? "rgba(0,0,0,.55)" : "#fff"} d="M9.6 15.6V8.4l6.2 3.6z" />
      </svg>
    );
  }
  if (name === "messenger" && !mono) {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id="bl-ms" x1="4" y1="22" x2="20" y2="2" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FF5CC6" /><stop offset="0.45" stopColor="#A033FF" /><stop offset="1" stopColor="#0099FF" /></linearGradient>
        </defs>
        <path fill="url(#bl-ms)" d={PATH.messenger} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path fill={fill} d={PATH[name] || PATH.x} />
    </svg>
  );
}

// Glow colour used by the blinking rings.
export const glowOf = (name) => (name === "x" ? "#FFFFFF" : LOGO_COLOR[name] || "#E8352B");
