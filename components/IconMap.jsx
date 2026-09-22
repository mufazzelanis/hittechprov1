import {
  Zap, Star, Palette, PenTool, GraduationCap, Video, Bot, Tv, Crown, Gem, ShieldCheck, Search,
} from "lucide-react";

const MAP = {
  zap: Zap, star: Star, palette: Palette, pen: PenTool, graduation: GraduationCap, video: Video,
  bot: Bot, tv: Tv, crown: Crown, gem: Gem, shield: ShieldCheck, search: Search,
};

export default function Icon({ name, ...props }) {
  const C = MAP[name] || Zap;
  return <C {...props} />;
}
