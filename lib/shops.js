// "Our other shops": one per line in Admin -> Page Content ->  Name | https://link | short description
export function parseShops(text) {
  const out = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const [name = "", url = "", ...d] = line.split("|").map((x) => x.trim());
    if (!name || !/^https?:\/\//i.test(url)) continue;
    out.push({ name, url, desc: d.join(" | ") });
  }
  return out.slice(0, 20);
}
