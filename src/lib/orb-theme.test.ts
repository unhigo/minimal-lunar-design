import { describe, expect, it } from "vitest";
import { parseCssColor, readOrbPalette } from "./orb-theme";

describe("parseCssColor", () => {
  it("parses oklch() with plain lightness", () => {
    // oklch(1 0 0) is white in sRGB (float precision → closeTo).
    expect(parseCssColor("oklch(1 0 0)")!.every((v) => Math.abs(v - 1) < 1e-9)).toBe(true);
  });

  it("parses oklch() with percentage lightness and degree hue", () => {
    // oklch(0.55 0.2 25) — warm red hue (≈ the brand ember).
    const rgb = parseCssColor("oklch(0.55 0.2 25)")!;
    expect(rgb[0]).toBeGreaterThan(0.7);
    expect(rgb[1]).toBeLessThan(0.4);
    expect(rgb[2]).toBeLessThan(0.4);
  });

  it("projects chroma correctly onto hue axes (oklab b = sin(h)·C, not sin²(h))", () => {
    // Regression: an earlier revision computed b = sin(h)·sin(h), dropping
    // chroma from the b axis — that mapped oklch(0.55 0.2 25) to
    // (0.863, 0, 0). The correct CSS-Color-4 conversion gives ≈
    // (0.802, 0.151, 0.181); verify against that reference.
    const rgb = parseCssColor("oklch(0.55 0.2 25)")!;
    expect(rgb[0]).toBeCloseTo(0.802, 2);
    expect(rgb[1]).toBeCloseTo(0.151, 2);
    expect(rgb[2]).toBeCloseTo(0.181, 2);
  });

  it("keeps achromatic oklch exactly neutral for any hue", () => {
    for (const h of ["0", "45", "90", "180", "270", "313.7"]) {
      const rgb = parseCssColor(`oklch(0.5 0 ${h})`)!;
      expect(rgb[0]).toBe(rgb[1]);
      expect(rgb[1]).toBe(rgb[2]);
    }
  });

  it("parses hex colors", () => {
    expect(parseCssColor("#ff0033")).toEqual([1, 0, 0.2]);
  });

  it("parses short hex", () => {
    expect(parseCssColor("#fff")).toEqual([1, 1, 1]);
    expect(parseCssColor("#000")).toEqual([0, 0, 0]);
  });

  it("parses rgb()/rgba()", () => {
    expect(parseCssColor("rgb(255, 0, 51)")).toEqual([1, 0, 0.2]);
    expect(parseCssColor("rgba(255, 0, 51, 0.5)")).toEqual([1, 0, 0.2]);
    expect(parseCssColor("rgb(51 0 255)")).toEqual([0.2, 0, 1]);
  });

  it("returns null for garbage or empty input", () => {
    expect(parseCssColor("auto")).toBeNull();
    expect(parseCssColor("")).toBeNull();
  });

  it("clamps out-of-range oklab output to [0,1]", () => {
    const rgb = parseCssColor("oklch(0.99 0.4 300)")!;
    for (const ch of rgb) expect(ch).toBeLessThanOrEqual(1);
    for (const ch of rgb) expect(ch).toBeGreaterThanOrEqual(0);
  });
});

describe("readOrbPalette — non-DOM fallback", () => {
  it("returns the MOONØ defaults when document is unavailable (SSR/tests)", () => {
    // In the node test environment there is no `document`, so cssVar()
    // returns empty strings and every token falls back.
    const palette = readOrbPalette();
    expect(palette.ink).toEqual([0.96, 0.96, 0.96]);
    expect(palette.void_).toEqual([0.13, 0.13, 0.13]);
    expect(palette.ember).toEqual([1, 0, 0.2]);
    expect(palette.dark).toBe(false);
  });
});
