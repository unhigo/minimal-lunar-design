import { describe, expect, it } from "vitest";
import { NAV_SECTIONS } from "./nav";
import { CATEGORIES } from "./catalog";
import { INSPIRATION_CATEGORIES } from "../data/inspiration";
import { DIRECTORY_SECTIONS } from "../data/directory";

/** Flatten every link in the manifest (group links + submenu links). */
function allLinks() {
  return NAV_SECTIONS.flatMap((s) =>
    s.groups.flatMap((g) => [
      ...g.links,
      ...(g.subs ?? []).flatMap((sub) => sub.links),
    ]),
  );
}

/** Routes that exist in src/main.tsx (static paths only). */
const ROUTES = [
  "/",
  "/auth",
  "/dashboard",
  "/studio",
  "/catalog",
  "/tools",
  "/directory",
  "/lab",
  "/discover",
  "/inspiration",
  "/projects",
  "/creators",
  "/articles",
  "/collections",
  "/submit",
  "/upload",
  "/admin",
];

describe("nav manifest", () => {
  it("every section has a label and at least one group with links", () => {
    expect(NAV_SECTIONS.length).toBeGreaterThan(0);
    for (const section of NAV_SECTIONS) {
      expect(section.id).toBeTruthy();
      expect(section.label).toBeTruthy();
      expect(section.groups.length).toBeGreaterThan(0);
      for (const group of section.groups) {
        const entries = group.links.length + (group.subs?.length ?? 0);
        expect(entries).toBeGreaterThan(0);
      }
    }
  });

  it("section ids are unique — they key the menubar's open state", () => {
    const ids = NAV_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every link is absolute ('/') and carries a label", () => {
    const links = allLinks();
    // The reorganization must cover pages, categories and subcategories.
    expect(links.length).toBeGreaterThan(30);
    for (const link of links) {
      expect(link.to.startsWith("/")).toBe(true);
      expect(link.label.length).toBeGreaterThan(0);
    }
  });

  it("every link target resolves to a real route (no dead hrefs)", () => {
    for (const link of allLinks()) {
      const base = link.to.split("?")[0];
      expect(ROUTES).toContain(base);
    }
  });

  it("catalog filter links use valid catalog categories", () => {
    const catLinks = allLinks().filter((l) => l.to.includes("/catalog?cat="));
    expect(catLinks.length).toBe(CATEGORIES.length);
    for (const link of catLinks) {
      const cat = new URLSearchParams(link.to.split("?")[1]).get("cat");
      expect(CATEGORIES).toContain(cat);
    }
  });

  it("inspiration filter links use valid inspiration categories", () => {
    const tagLinks = allLinks().filter((l) =>
      l.to.includes("/inspiration?tag="),
    );
    expect(tagLinks.length).toBe(INSPIRATION_CATEGORIES.length);
    for (const link of tagLinks) {
      const tag = new URLSearchParams(link.to.split("?")[1]).get("tag");
      expect(INSPIRATION_CATEGORIES).toContain(tag);
    }
  });

  it("directory section links use valid directory sections", () => {
    const dirLinks = allLinks().filter((l) => l.to.startsWith("/directory?s="));
    expect(dirLinks.length).toBe(DIRECTORY_SECTIONS.length);
    for (const link of dirLinks) {
      const s = new URLSearchParams(link.to.split("?")[1]).get("s");
      expect(DIRECTORY_SECTIONS).toContain(s);
    }
  });

  it("discover search links carry a non-empty query", () => {
    const qLinks = allLinks().filter((l) => l.to.startsWith("/discover?q="));
    expect(qLinks.length).toBeGreaterThan(0);
    for (const link of qLinks) {
      const q = new URLSearchParams(link.to.split("?")[1]).get("q");
      expect(q?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
