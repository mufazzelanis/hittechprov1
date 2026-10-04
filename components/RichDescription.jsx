import { Check } from "lucide-react";

// Admin-written description: paragraphs, and lines starting with "-" as bullet points. Plain text only.
export default function RichDescription({ text }) {
  const blocks = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { blocks.push(null); continue; }
    const bullet = /^[-•*]\s*/.test(line);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      const item = line.replace(/^[-•*]\s*/, "");
      if (last?.type === "ul") last.items.push(item); else blocks.push({ type: "ul", items: [item] });
    } else if (last?.type === "p") last.text += " " + line;
    else blocks.push({ type: "p", text: line });
  }
  return (
    <div className="space-y-4 text-fg/85 leading-relaxed">
      {blocks.filter(Boolean).map((b, i) => b.type === "ul" ? (
        <ul key={i} className="space-y-2">
          {b.items.map((x, j) => <li key={j} className="flex items-start gap-2.5"><Check size={16} className="text-brand shrink-0 mt-1" /><span>{x}</span></li>)}
        </ul>
      ) : <p key={i}>{b.text}</p>)}
    </div>
  );
}
