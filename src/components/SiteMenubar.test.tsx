// @vitest-environment happy-dom
/**
 * DOM tests for the SiteMenubar (shadcn Menubar + glass styling).
 *
 * Scope: the menubar's own wiring — structure, glass material, the real
 * <a href> produced by MenubarItem asChild+Link, and keyboard open/close.
 * Radix menu behaviors that need real pointer events (hover-to-open, portal
 * positioning, outside-click dismissal) are out of scope for a DOM
 * environment — those stay E2E.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SiteMenubar } from "./SiteMenubar";
import { NAV_SECTIONS, isNavPathActive } from "@/lib/nav";

function renderMenubar(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SiteMenubar />
    </MemoryRouter>,
  );
}

// RTL's auto-cleanup needs global afterEach; vitest runs without globals.
afterEach(cleanup);

function triggerFor(index: number) {
  const label = NAV_SECTIONS[index].label;
  return screen.getByRole("menuitem", { name: new RegExp(label) });
}

describe("SiteMenubar", () => {
  it("renders one trigger per section, in manifest order", () => {
    renderMenubar();
    // getByRole throws when absent, so each lookup asserts presence.
    for (const section of NAV_SECTIONS) {
      expect(
        screen.getByRole("menuitem", { name: new RegExp(section.label) }),
      ).toBeTruthy();
    }
  });

  it("the bar carries the glass material", () => {
    renderMenubar();
    const menubar = screen.getByRole("menubar");
    expect(menubar.className).toContain("glass-panel");
  });

  it("menu links render as real anchors to absolute routes", () => {
    renderMenubar();
    // Radix menubar opens on keydown; happy-dom does not synthesize the
    // pointer sequence a click needs.
    const trigger = triggerFor(0);
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    // MenubarItem asChild keeps the menuitem role on the <a> — distinguish
    // anchors from the section triggers by tag name.
    const anchors = screen
      .getAllByRole("menuitem")
      .filter((el) => el.tagName === "A");
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      expect(anchor.getAttribute("href")).toMatch(/^\//);
    }
  });

  it("keyboard: Enter opens a menu, Escape closes it", () => {
    renderMenubar();
    const trigger = triggerFor(1);
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("exposes exactly the manifest's section triggers", () => {
    renderMenubar("/");
    expect(screen.getAllByRole("menuitem").length).toBe(NAV_SECTIONS.length);
  });
});

describe("isNavPathActive", () => {
  it("exact match is active", () => {
    expect(isNavPathActive("/tools", "/tools")).toBe(true);
  });

  it("prefix matches only at segment boundaries", () => {
    expect(isNavPathActive("/tools-archive", "/tools")).toBe(false);
    expect(isNavPathActive("/tools/nyxhora", "/tools")).toBe(true);
  });

  it("root matches only the root", () => {
    expect(isNavPathActive("/", "/")).toBe(true);
    expect(isNavPathActive("/tools", "/")).toBe(false);
  });

  it("ignores query strings in the href", () => {
    expect(isNavPathActive("/catalog", "/catalog?cat=iconos")).toBe(true);
  });
});
