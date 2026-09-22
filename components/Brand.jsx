import { ExternalLink } from "lucide-react";
import BrandLogo from "./BrandLogo";

// Brand colours + icons for the "join our channel" steps.
export const JOIN_TYPES = ["telegram", "whatsapp", "facebook", "instagram", "youtube", "other"];

export const BRAND = {
  telegram: { name: "Telegram", from: "#3DBBF5", to: "#1B7FC4", glow: "#229ED9" },
  whatsapp: { name: "WhatsApp", from: "#2BE372", to: "#0E9F6E", glow: "#25D366" },
  facebook: { name: "Facebook", from: "#4C8BF5", to: "#1456C8", glow: "#1877F2" },
  instagram: { name: "Instagram", from: "#F9B233", to: "#D6249F", glow: "#E4405F" },
  youtube: { name: "YouTube", from: "#FF5A5A", to: "#C4001D", glow: "#FF0000" },
  other: { name: "Link", from: "#8B95A7", to: "#4B5567", glow: "#6B7280" },
};

export function BrandIcon({ type, size = 22 }) {
  return type === "other" ? <ExternalLink size={size} strokeWidth={2.2} /> : <BrandLogo name={type} size={size} mono />;
}
