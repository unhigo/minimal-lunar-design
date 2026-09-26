const raw = JSON.parse(require("fs").readFileSync("/tmp/rows_clean.json", "utf8")) as string[];
const rows = raw.map((line) => JSON.parse(line) as [string, string, string, string, string]);
const T_SUBS = ["Color", "UX", "3D", "Link Shortener"];
const R_SUBS = ["Icons", "UI Kit", "Mockups", "Figma", "Graphics", "Templates"];
const missing: string[] = [];
const cnt: Record<string, number> = {};
for (const [name, tagsStr, , , section] of rows) {
  const tags = tagsStr.split(",").map((t) => t.trim());
  if (section === "Tools") {
    const t = tags.find((x) => T_SUBS.includes(x));
    if (!t) missing.push(`Tools|${name}|${tagsStr}`);
    else cnt[`T:${t}`] = (cnt[`T:${t}`] ?? 0) + 1;
  }
  if (section === "Resources") {
    const rr = tags.find((x) => R_SUBS.includes(x));
    if (!rr) missing.push(`Res|${name}|${tagsStr}`);
    else cnt[`R:${rr}`] = (cnt[`R:${rr}`] ?? 0) + 1;
  }
  if (section === "Inspiration") {
    const k = tags.includes("Interface") ? "I:Interfaces" : "I:Galerias";
    cnt[k] = (cnt[k] ?? 0) + 1;
  }
  if (section === "Framer Teamplates") {
    cnt["F:Personal"] = (cnt["F:Personal"] ?? 0) + 1;
  }
}
console.log("SECTIONS:", JSON.stringify([...new Set(rows.map((r) => r[4]))]));
console.log("MISSING:", JSON.stringify(missing));
console.log("COUNTS:", JSON.stringify(cnt));
console.log("TOTAL", rows.length);
