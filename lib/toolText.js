// A tool's description may contain bullet lines ("- Includes 1 month access").
// Plain lines form the intro paragraph; bullet lines become the feature list.
export function splitDescription(d = "") {
  const intro = [];
  const feats = [];
  for (const line of String(d).split(/\r?\n/)) {
    const m = line.match(/^\s*[-•*]\s+(.*)$/);
    if (m) feats.push(m[1].trim());
    else if (line.trim()) intro.push(line.trim());
  }
  return { intro: intro.join(" "), feats };
}
