import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { parseCssColor } from "./orb-theme";

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
