import { describe, expect, it } from "vitest";
import { slugify, pricingFromSubmitCategory, mapSubmitCategoryToDirectory } from "./directory-utils";

describe("slugify", () => {
  it("lowercases, strips accents and joins with dashes", () => {
    expect(slugify("Herramienta Astronómica Ñu")).toBe("herramienta-astronomica-nu");
  });

  it("collapses repeated separators", () => {
    expect(slugify("  Stellarium   Web!  ")).toBe("stellarium-web");
  });

  it("limits length to 60 chars", () => {
    const out = slugify("x".repeat(120));
    expect(out.length).toBeLessThanOrEqual(60);
  });

  it("keeps digits and dots", () => {
    expect(slugify("ray.so 2.0")).toBe("ray-so-2-0");
  });
});

describe("pricing mapping from submit wizard", () => {
  it("maps one-time to paid", () => {
    expect(pricingFromSubmitCategory("one-time")).toBe("paid");
  });

  it("maps free to free", () => {
    expect(pricingFromSubmitCategory("free")).toBe("free");
  });

  it("maps freemium to freemium", () => {
    expect(pricingFromSubmitCategory("freemium")).toBe("freemium");
  });

  it("maps subscription to paid", () => {
    expect(pricingFromSubmitCategory("subscription")).toBe("paid");
  });
});

describe("category mapping", () => {
  it("maps ai to ia", () => {
    expect(mapSubmitCategoryToDirectory("ai")).toBe("ia");
  });

  it("passes through other categories", () => {
    expect(mapSubmitCategoryToDirectory("ui-ux")).toBe("ui-ux");
  });
});
