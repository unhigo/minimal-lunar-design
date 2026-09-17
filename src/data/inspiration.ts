/**
 * Inspiration feed data (MVP: local demo data, clearly marked).
 *
 * These entries are demo content to make the discovery experience tangible.
 * They are NOT real works by real creators — every entry is marked `demo`
 * so the UI can label it honestly and real submissions can replace them
 * when the backend grows into it.
 */

export interface InspirationItem {
  id: string;
  title: string;
  category: InspirationCategory;
  tags: string[];
  /** Deterministic abstract cover (no external images in the MVP). */
  gradient: string;
  aspect: "4/3" | "1/1" | "3/4" | "16/9";
  creator: string;
  source: string;
  year: number;
  demo: true;
}

export const INSPIRATION_CATEGORIES = [
  "web",
  "ui",
  "ux",
  "branding",
  "tipografía",
  "motion",
  "3d",
  "ilustración",
  "fotografía",
  "arte digital",
] as const;

export type InspirationCategory = (typeof INSPIRATION_CATEGORIES)[number];

type Seed = Omit<InspirationItem, "demo">;

const G = {
  moonlight: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  dust: "linear-gradient(160deg, #2b2b33 0%, #3d3d4a 45%, #101014 100%)",
  eclipse: "linear-gradient(150deg, #0b0b10 0%, #1f1f27 55%, #2c2c36 100%)",
  terra: "linear-gradient(140deg, #16211c 0%, #22332a 50%, #0d1411 100%)",
  ember: "linear-gradient(145deg, #241a12 0%, #3d2c1c 50%, #120d08 100%)",
  sea: "linear-gradient(155deg, #0e1c24 0%, #16303e 55%, #090f14 100%)",
  violetDusk: "linear-gradient(150deg, #1c1724 0%, #2e2440 50%, #0f0c14 100%)",
  bone: "linear-gradient(140deg, #232320 0%, #37372f 50%, #121210 100%)",
  chrome: "linear-gradient(135deg, #1e2226 0%, #30373d 45%, #0c0e10 100%)",
  crimson: "linear-gradient(150deg, #251214 0%, #3c1e20 50%, #10080a 100%)",
} as const;

const SEED: Seed[] = [
  { id: "i-01", title: "Estación Polar — sitio editorial", category: "web", tags: ["editorial", "tipografía", "grid"], gradient: G.moonlight, aspect: "4/3", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-02", title: "Identidad Helios", category: "branding", tags: ["identidad", "logotipo"], gradient: G.ember, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-03", title: "App Calendario Lunar", category: "ui", tags: ["mobile", "dark", "calendario"], gradient: G.dust, aspect: "3/4", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-04", title: "Cartelería.tipográfica nº4", category: "tipografía", tags: ["cartel", "serif"], gradient: G.bone, aspect: "4/3", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-05", title: "Onboarding sin fricción", category: "ux", tags: ["flujo", "caso de estudio"], gradient: G.sea, aspect: "16/9", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-06", title: "Loop orbital", category: "motion", tags: ["loop", "3d"], gradient: G.eclipse, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-07", title: "Cera — render de producto", category: "3d", tags: ["producto", "render"], gradient: G.chrome, aspect: "4/3", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-08", title: "Nocturnos — serie fotográfica", category: "fotografía", tags: ["noche", "larga exposición"], gradient: G.moonlight, aspect: "3/4", creator: "Estudio demo", source: "Demo interno", year: 2024 },
  { id: "i-09", title: "Kiln — sistema de iconos", category: "ui", tags: ["iconos", "sistema"], gradient: G.dust, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-10", title: "Field Notes — embalaje", category: "branding", tags: ["embalaje", "editorial"], gradient: G.terra, aspect: "4/3", creator: "Estudio demo", source: "Demo interno", year: 2024 },
  { id: "i-11", title: "Interfaz obsidiana", category: "ui", tags: ["dashboard", "dark"], gradient: G.eclipse, aspect: "16/9", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-12", title: "Vapor — arte generativo", category: "arte digital", tags: ["generativo", "p5"], gradient: G.violetDusk, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-13", title: "Revista Meridiano", category: "web", tags: ["revista", "grid"], gradient: G.bone, aspect: "16/9", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-14", title: "Cinzas — portada de álbum", category: "ilustración", tags: ["portada", "textura"], gradient: G.crimson, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-15", title: "Micro-interacciones vol. 2", category: "motion", tags: ["micro", "proto"], gradient: G.sea, aspect: "4/3", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-16", title: "Guía rápida de escala", category: "tipografía", tags: ["escala", "referencia"], gradient: G.terra, aspect: "3/4", creator: "Estudio demo", source: "Demo interno", year: 2024 },
  { id: "i-17", title: "Depósito — escena 3D", category: "3d", tags: ["arquitectura", "render"], gradient: G.chrome, aspect: "3/4", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-18", title: "Faro — web de producto", category: "web", tags: ["producto", "landing"], gradient: G.moonlight, aspect: "4/3", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-19", title: "Grain — colección de texturas", category: "arte digital", tags: ["textura", "grano"], gradient: G.bone, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2024 },
  { id: "i-20", title: "Mar de nubes — póster", category: "ilustración", tags: ["póster", "paisaje"], gradient: G.sea, aspect: "3/4", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-21", title: "Ritmo — identidad en movimiento", category: "motion", tags: ["identidad", "kinético"], gradient: G.violetDusk, aspect: "16/9", creator: "Estudio demo", source: "Demo interno", year: 2026 },
  { id: "i-22", title: "Cámara oscura — serie", category: "fotografía", tags: ["b/n", "contraste"], gradient: G.eclipse, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2023 },
  { id: "i-23", title: "Navegación por gestos", category: "ux", tags: ["mobile", "patrones"], gradient: G.dust, aspect: "4/3", creator: "Estudio demo", source: "Demo interno", year: 2025 },
  { id: "i-24", title: "Monograma LL", category: "branding", tags: ["monograma", "minimal"], gradient: G.crimson, aspect: "1/1", creator: "Estudio demo", source: "Demo interno", year: 2026 },
];

export const INSPIRATION: InspirationItem[] = SEED.map((s) => ({ ...s, demo: true as const }));

export function searchInspiration(query: string, category?: string): InspirationItem[] {
  const needle = query.trim().toLowerCase();
  let result = INSPIRATION;
  if (category && category !== "all") {
    result = result.filter((i) => i.category === category);
  }
  if (!needle) return result;
  return result.filter(
    (i) =>
      i.title.toLowerCase().includes(needle) ||
      i.creator.toLowerCase().includes(needle) ||
      i.tags.some((t) => t.toLowerCase().includes(needle)),
  );
}
