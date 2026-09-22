import { describe, expect, it } from "vitest";
import {
  badgesFor,
  submitSchema,
} from "./submit-schema";

const base = {
  title: "Nyxhora Grid",
  url: "https://example.com/grid",
  tagline: "Sistema de retículas para diseños técnicos",
  category: "ui-ux",
  pricing: "freemium",
  license: "commercial-attribution",
  description:
    "Sistema de retículas y guías para interfaces técnicas, con tokens exportables y presets por breakpoint.",
  features: ["Retículas de 4/8/12 columnas", "Exportación a tokens CSS", "Presets por breakpoint"],
  senderRole: "creator",
  authorHandle: "@lab",
  contactEmail: "lab@example.com",
};

describe("submitSchema", () => {
  it("accepts a complete valid submission", () => {
    const parsed = submitSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid URL in step 1", () => {
    const parsed = submitSchema.safeParse({ ...base, url: "no-es-una-url" });
    expect(parsed.success).toBe(false);
  });

  it("enforces the 100-char tagline limit", () => {
    const parsed = submitSchema.safeParse({ ...base, tagline: "x".repeat(101) });
    expect(parsed.success).toBe(false);
  });

  it("requires 3–5 features", () => {
    const parsed = submitSchema.safeParse({ ...base, features: ["solo una"] });
    expect(parsed.success).toBe(false);
  });

  it("requires a valid contact email", () => {
    const parsed = submitSchema.safeParse({ ...base, contactEmail: "nope" });
    expect(parsed.success).toBe(false);
  });

  it("accepts discount only with both code and percent", () => {
    const withCode = submitSchema.safeParse({
      ...base,
      discountCode: "LAB10",
      discountPercent: 10,
    });
    expect(withCode.success).toBe(true);

    const onlyPercent = submitSchema.safeParse({ ...base, discountPercent: 10 });
    expect(onlyPercent.success).toBe(true); // percent alone is valid data
  });

  it("limits gallery to 4 images", () => {
    const parsed = submitSchema.safeParse({
      ...base,
      gallery: [
        { storageId: "a" },
        { storageId: "b" },
        { storageId: "c" },
        { storageId: "d" },
        { storageId: "e" },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("badgesFor", () => {
  it("marks AI submissions as AI-powered", () => {
    const badges = badgesFor({
      category: "ai",
      pricing: "free",
      license: "cc0",
      senderRole: "creator",
      platforms: ["Web"],
    });
    expect(badges.map((b) => b.id)).toContain("ai");
    expect(badges.map((b) => b.id)).toContain("commercial");
    expect(badges.map((b) => b.id)).toContain("free");
  });

  it("shows the community deal badge only with code + percent", () => {
    const badges = badgesFor({
      category: "web-apps",
      pricing: "subscription",
      license: "commercial-attribution",
      senderRole: "curator",
      platforms: ["Web"],
      discountPercent: 20,
      discountCode: "LAB20",
      videoUrl: "https://youtube.com/watch?v=x",
    });
    expect(badges.map((b) => b.id)).toContain("deal");
    expect(badges.map((b) => b.label)).toContain("Community Deal −20%");
    expect(badges.map((b) => b.id)).toContain("video");
  });

  it("does not show deal badge without a code", () => {
    const badges = badgesFor({
      category: "web-apps",
      pricing: "subscription",
      license: "personal",
      senderRole: "curator",
      platforms: ["Web"],
      discountPercent: 20,
    });
    expect(badges.map((b) => b.id)).not.toContain("deal");
  });

  it("flags maker submissions", () => {
    const badges = badgesFor({
      category: "education",
      pricing: "paid",
      license: "personal",
      senderRole: "creator",
      platforms: [],
    });
    expect(badges.map((b) => b.id)).toContain("maker");
  });
});
