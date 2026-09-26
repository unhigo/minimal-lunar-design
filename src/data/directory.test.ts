import { describe, expect, it } from "vitest";
import {
  DIRECTORY,
  DIRECTORY_SECTIONS,
  DIRECTORY_SUBCATEGORIES,
  directoryBySection,
  directoryGrouped,
} from "./directory";

describe("DIRECTORY", () => {
  it("imports the full Unhigo Makers catalog (224 entries)", () => {
    expect(DIRECTORY.length).toBe(224);
  });

  it("has the four source sections with expected counts", () => {
    const count = (s: string) => DIRECTORY.filter((e) => e.section === s).length;
    expect(count("tools")).toBe(134);
    expect(count("resources")).toBe(82);
    expect(count("framer")).toBe(2);
    expect(count("inspiration")).toBe(6);
  });

  it("assigns every entry a valid section and subcategory", () => {
    for (const entry of DIRECTORY) {
      expect(DIRECTORY_SECTIONS).toContain(entry.section);
      expect(DIRECTORY_SUBCATEGORIES[entry.section]).toContain(entry.sub);
    }
  });

  it("has unique slugs and http(s) URLs", () => {
    const slugs = new Set(DIRECTORY.map((e) => e.slug));
    expect(slugs.size).toBe(DIRECTORY.length);
    for (const entry of DIRECTORY) {
      expect(entry.url).toMatch(/^https?:\/\//);
    }
  });

  it("only uses known pricing values", () => {
    for (const entry of DIRECTORY) {
      expect(["free", "freemium", "paid"]).toContain(entry.pricing);
    }
  });

  it("describes every entry (no empty fallbacks)", () => {
    for (const entry of DIRECTORY) {
      expect(entry.shortDescription.length).toBeGreaterThan(3);
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });
});

describe("directoryBySection", () => {
  it("filters one section preserving source order", () => {
    const tools = directoryBySection("tools");
    expect(tools.length).toBe(134);
    expect(tools.every((e) => e.section === "tools")).toBe(true);
    expect(tools[0].name).toBe("Tally");
  });
});

describe("directoryGrouped", () => {
  it("groups by the canonical subcategory order", () => {
    const groups = directoryGrouped("tools");
    expect(groups.map((g) => g.sub)).toEqual([
      "Color",
      "UX",
      "3D",
      "Link Shortener",
    ]);
  });

  it("partitions the section completely (no entry lost, none duplicated)", () => {
    const groups = directoryGrouped("resources");
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    expect(total).toBe(directoryBySection("resources").length);
    for (const g of groups) {
      expect(g.items.every((e) => e.sub === g.sub)).toBe(true);
    }
  });

  it("omits empty subcategories", () => {
    // Framer has exactly one subcategory (Personal) with 2 entries.
    const groups = directoryGrouped("framer");
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(2);
  });
});
