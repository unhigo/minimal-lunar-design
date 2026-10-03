import { describe, expect, it } from "vitest";
import {
  CATEGORY_ORDER,
  FOOTER_ICON_KEYS,
  FOOTER_LINK_GROUPS,
  OFFICIAL_BADGES,
  WHATSAPP,
  categoryRank,
} from "./footer-links";
import { groupFooterRows } from "../convex/footer_links";

const ALL_LINKS = FOOTER_LINK_GROUPS.flatMap((g) => g.links);

describe("footer-links (base de datos de enlaces del pie)", () => {
  it("organiza 8 enlaces en las 5 categorías editoriales, en orden", () => {
    expect(FOOTER_LINK_GROUPS).toHaveLength(5);
    expect(FOOTER_LINK_GROUPS.map((g) => g.category)).toEqual([
      ...CATEGORY_ORDER,
    ]);
    expect(ALL_LINKS).toHaveLength(8);
  });

  it("usa claves de icono registradas y nombres únicos", () => {
    for (const link of ALL_LINKS) {
      expect(FOOTER_ICON_KEYS).toContain(link.icon);
    }
    const names = ALL_LINKS.map((l) => l.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("solo contiene URLs absolutas http(s)", () => {
    for (const link of ALL_LINKS) {
      const url = new URL(link.url);
      expect(["http:", "https:"]).toContain(url.protocol);
    }
  });

  it("categoryRank ordena conocidas y manda desconocidas al final", () => {
    expect(categoryRank("Portafolio")).toBe(0);
    expect(categoryRank("Referidos")).toBe(4);
    expect(categoryRank("Categoría Inventada")).toBe(CATEGORY_ORDER.length);
  });

  it("expone el CTA de WhatsApp oficial", () => {
    expect(WHATSAPP.href).toBe("https://wa.me/34613573082");
    expect(WHATSAPP.phone).toBe("+34 613 57 30 82");
  });

  it("declara badges oficiales únicos con URLs https y alt", () => {
    const ids = OFFICIAL_BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const badge of OFFICIAL_BADGES) {
      expect(badge.href).toMatch(/^https:/);
      expect(badge.src).toMatch(/^https:/);
      expect(badge.alt.length).toBeGreaterThan(0);
    }
  });
});

describe("groupFooterRows (agrupación servidor de footerLinks)", () => {
  it("agrupa por categoría en orden editorial y ordena enlaces internos", () => {
    const rows = [
      { category: "Referidos", name: "Manus AI", sortOrder: 1 },
      { category: "Portafolio", name: "Dribbble", sortOrder: 0 },
      { category: "Referidos", name: "FreeBuff", sortOrder: 0 },
    ];
    const groups = groupFooterRows(rows);
    expect(groups.map((g) => g.category)).toEqual(["Portafolio", "Referidos"]);
    expect(groups[1]?.links.map((l) => l.name)).toEqual(["FreeBuff", "Manus AI"]);
  });

  it("categorías desconocidas van tras las conocidas", () => {
    const rows = [
      { category: "Nueva", name: "X", sortOrder: 0 },
      { category: "Redes Sociales", name: "Twitch", sortOrder: 0 },
    ];
    const groups = groupFooterRows(rows);
    expect(groups.map((g) => g.category)).toEqual(["Redes Sociales", "Nueva"]);
  });

  it("devuelve grupos vacíos para entrada vacía", () => {
    expect(groupFooterRows([])).toEqual([]);
  });
});
