import { describe, expect, it } from "vitest";
import {
  EASE_IN_OUT,
  EASE_OUT,
  SPRING_LAYOUT,
  SPRING_PRESS,
} from "./ease";

describe("motion tokens", () => {
  it("EASE_OUT is the documented 4-point cubic-bezier", () => {
    expect(EASE_OUT).toEqual([0.16, 1, 0.3, 1]);
  });

  it("EASE_IN_OUT is symmetric", () => {
    expect(EASE_IN_OUT).toEqual([0.65, 0, 0.35, 1]);
  });

  it("SPRING_PRESS is fast and weighted (immediate press feel)", () => {
    expect(SPRING_PRESS.type).toBe("spring");
    expect(SPRING_PRESS.stiffness).toBeGreaterThanOrEqual(400);
    expect(SPRING_PRESS.mass).toBeLessThanOrEqual(1);
  });

  it("SPRING_LAYOUT is softer than press (shared surfaces travel)", () => {
    expect(SPRING_LAYOUT.type).toBe("spring");
    expect(SPRING_LAYOUT.stiffness).toBeLessThan(SPRING_PRESS.stiffness);
    expect(SPRING_LAYOUT.damping).toBeGreaterThanOrEqual(SPRING_LAYOUT.stiffness / 20);
  });

  it("both springs settle (damped, no perpetual oscillation)", () => {
    // damping ratio ζ = c / (2·√(k·m)) — over-damped/critically damped reads calm.
    const zeta = (s: { stiffness: number; damping: number; mass: number }) =>
      s.damping / (2 * Math.sqrt(s.stiffness * s.mass));
    expect(zeta(SPRING_PRESS)).toBeGreaterThan(0.6);
    expect(zeta(SPRING_LAYOUT)).toBeGreaterThan(0.6);
  });
});
