/**
 * One-shot generator for src/data/directory.ts from /tmp/rows_clean.json.
 * Run: bun scripts/tmp-gendir.ts
 */
import fs from "node:fs";

const raw = JSON.parse(fs.readFileSync("/tmp/rows_clean.json", "utf8")) as string[];
const rows = raw.map((line) => JSON.parse(line) as [string, string, string, string, string]);

const T_SUBS = ["Color", "UX", "3D", "Link Shortener"];
const R_SUBS = ["Icons", "UI Kit", "Mockups", "Figma", "Graphics", "Templates"];

// Pricing heuristics from the Notion tags + name hints.
function pricingOf(tags: string[], name: string): "free" | "freemium" | "paid" {
  const has = (t: string) => tags.includes(t);
  if (has("Free") && !has("Premium")) return "free";
  if (has("Free") && has("Premium")) return "freemium";
  if (has("Premium")) return "paid";
  if (/trial/i.test(name)) return "freemium";
  return "freemium";
}

// Section + subcategory resolution shared with the generator and runtime.
function classify(section: string, tags: string[]): { section: string; sub: string } {
  if (section === "Tools") {
    const sub = tags.find((t) => T_SUBS.includes(t)) ?? "UX";
    return { section: "tools", sub };
  }
  if (section === "Resources") {
    const sub = tags.find((t) => R_SUBS.includes(t)) ?? "Graphics";
    return { section: "resources", sub };
  }
  if (section === "Inspiration") {
    return { section: "inspiration", sub: tags.includes("Interface") ? "Interfaces" : "Galerías" };
  }
  return { section: "framer", sub: "Personal" };
}

// Long descriptions are trimmed; multi-line strings are collapsed.
const SUB_ES: Record<string, string> = {
  Color: "herramienta de color",
  UX: "herramienta de UX",
  "3D": "herramienta 3D",
  "Link Shortener": "acortador de enlaces",
  Icons: "librería de iconos",
  "UI Kit": "kit de UI",
  Mockups: "colección de mockups",
  Graphics: "recursos gráficos",
  Figma: "recurso para Figma",
  Templates: "plantillas",
  Personal: "plantilla personal",
  Interfaces: "galería de interfaces",
  "Galerías": "galería curada",
};

function cleanDesc(desc: string, fallback: string): string {
  const oneLine = desc.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
  // Drop "X,a,URL ..." artifacts from Notion rich-text segments.
  const cut = oneLine.replace(/,a,https?:\/\/\S+/g, "").replace(/a,https?:\/\/\S+\s*a?/g, "").trim();
  if (!cut) return fallback;
  return cut.length > 300 ? cut.slice(0, 297).trimEnd() + "…" : cut;
}

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const lines: string[] = [];
for (const [name, tagsStr, url, desc, section] of rows) {
  const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
  const { section: sec, sub } = classify(section, tags);
  const shortDescription = cleanDesc(desc, `${SUB_ES[sub] ?? sub}.`);
  const description = `${name} — ${shortDescription} Fuente: directorio curado de Unhigo Makers (Notion).`;
  const pricing = pricingOf(tags, name);
  const obj = {
    name,
    slug: slugOf(name),
    section: sec,
    sub,
    url,
    shortDescription,
    description,
    tags,
    pricing,
    featured: false,
    verified: false,
  };
  lines.push("  " + JSON.stringify(obj) + ",");
}

const header = `/**
 * Curated directory — imported from the Unhigo Makers catalog (Notion).
 *
 * ${rows.length} entries in three sections:
 * · TOOLS (${rows.filter(([, , , , s]) => s === "Tools").length}) — generators, pickers, testers and utilities (Color, UX, 3D, Link Shortener).
 * · RESOURCES (${rows.filter(([, , , , s]) => s === "Resources").length}) — downloadable kits and assets (Icons, UI Kit, Mockups, Graphics, Figma, Templates).
 * · FRAMER (${rows.filter(([, , , , s]) => s === "Framer Teamplates").length}) — personal templates for Framer (Premium).
 * · INSPIRATION (${rows.filter(([, , , , s]) => s === "Inspiration").length}) — curated galleries and interface showcases.
 *
 * Entries are data only: no external images, pricing is derived from the
 * source tags (Free / Premium), and the URL always points to the official site.
 */

export const DIRECTORY_SECTIONS = ["tools", "resources", "framer", "inspiration"] as const;
export type DirectorySection = (typeof DIRECTORY_SECTIONS)[number];

/** Subcategories per section — drives the "organize by category" UI. */
export const DIRECTORY_SUBCATEGORIES: Record<DirectorySection, readonly string[]> = {
  tools: ["Color", "UX", "3D", "Link Shortener"],
  resources: ["Icons", "UI Kit", "Mockups", "Graphics", "Figma", "Templates"],
  framer: ["Personal"],
  inspiration: ["Interfaces", "Galerías"],
};

export const DIRECTORY_SECTION_LABELS: Record<DirectorySection, string> = {
  tools: "Tools",
  resources: "Resources",
  framer: "Framer",
  inspiration: "Inspiration",
};

export interface DirectoryEntry {
  name: string;
  slug: string;
  section: DirectorySection;
  /** Subcategory within the section (Color, Icons, Mockups…). */
  sub: string;
  /** Official site URL. */
  url: string;
  shortDescription: string;
  description: string;
  tags: string[];
  pricing: "free" | "freemium" | "paid";
  featured: boolean;
  verified: boolean;
}

export const DIRECTORY: DirectoryEntry[] = [
`;

const footer = `];

/** All entries of one section, preserving source order. */
export function directoryBySection(section: DirectorySection): DirectoryEntry[] {
  return DIRECTORY.filter((e) => e.section === section);
}

/** Entries of one section grouped by subcategory, subcategories in canonical order. */
export function directoryGrouped(section: DirectorySection): { sub: string; items: DirectoryEntry[] }[] {
  const subs = DIRECTORY_SUBCATEGORIES[section];
  return subs
    .map((sub) => ({ sub, items: DIRECTORY.filter((e) => e.section === section && e.sub === sub) }))
    .filter((g) => g.items.length > 0);
}

export function directoryCount(): number {
  return DIRECTORY.length;
}
`;

fs.writeFileSync("src/data/directory.ts", header + lines.join("\n") + "\n" + footer);
console.log("written", lines.length, "entries");
