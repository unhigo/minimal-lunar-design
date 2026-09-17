import { describe, expect, it } from "vitest";
import { CATEGORIES, formatPrice, timeAgo } from "./catalog";

/** Intl uses no-break spaces (U+00A0) before €; normalize for assertions. */
function normalize(s: string): string {
  return s.replace(/\u00a0|\u202f/g, " ");
}

describe("formatPrice", () => {
  it("formats zero as free", () => {
    expect(formatPrice(0)).toBe("Gratis");
  });

  it("formats whole euros without decimals", () => {
    expect(normalize(formatPrice(500))).toBe("5 €");
  });

  it("keeps cents when the amount is not round", () => {
    expect(normalize(formatPrice(599))).toBe("5,99 €");
  });
});

describe("timeAgo", () => {
  it("handles just-now timestamps in seconds", () => {
    const now = Date.now();
    expect(timeAgo(now - 5_000)).toMatch(/^hace 5s$/);
  });

  it("uses minutes and hours below a day", () => {
    const now = Date.now();
    expect(timeAgo(now - 30 * 60_000)).toBe("hace 30 min");
    expect(timeAgo(now - 5 * 3_600_000)).toBe("hace 5 h");
  });

  it("switches to days and months", () => {
    const now = Date.now();
    expect(timeAgo(now - 3 * 86_400_000)).toBe("hace 3 d");
    expect(timeAgo(now - 45 * 86_400_000)).toBe("hace 1 meses");
  });

  it("handles years", () => {
    const now = Date.now();
    expect(timeAgo(now - 400 * 86_400_000)).toBe("hace 1 años");
  });
});

describe("CATEGORIES", () => {
  it("matches the schema's category list used by validators", () => {
    expect(CATEGORIES).toContain("mockups");
    expect(CATEGORIES).toContain("fuentes");
    expect(CATEGORIES).toHaveLength(8);
  });
});
