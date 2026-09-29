// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  EMPTY_FORM,
  STEPS,
  formatRef,
  hydrateForm,
  isBlockedHost,
  normalizeUrl,
  stepCompletion,
  stepIndex,
  validateStep,
} from "./submit-steps";

const OK: typeof EMPTY_FORM = {
  ...EMPTY_FORM,
  title: "Nyxhora Grid",
  url: "https://example.com/grid",
  tagline: "Retículas para interfaces técnicas",
  category: "ui-ux",
  description:
    "Sistema de retículas y guías para interfaces técnicas, con tokens exportables y presets por breakpoint.",
  features: ["Retículas de 4/8/12", "Exportación a tokens", "Presets por breakpoint"],
  authorHandle: "@lab",
  contactEmail: "lab@example.com",
};

describe("STEPS manifest", () => {
  it("has exactly 7 ordered steps", () => {
    expect(STEPS).toHaveLength(7);
    expect(STEPS.map((s) => s.id)).toEqual([
      "identity",
      "classification",
      "details",
      "media",
      "pricing",
      "creator",
      "review",
    ]);
  });

  it("stepIndex resolves ids in order", () => {
    expect(stepIndex("identity")).toBe(0);
    expect(stepIndex("review")).toBe(6);
    expect(stepIndex("pricing")).toBe(4);
  });
});

describe("validateStep", () => {
  it("identity requires name, URL and tagline", () => {
    expect(Object.keys(validateStep("identity", EMPTY_FORM))).toEqual(
      expect.arrayContaining(["title", "url", "tagline"]),
    );
    expect(validateStep("identity", OK)).toEqual({});
  });

  it("identity enforces length limits", () => {
    expect(validateStep("identity", { ...OK, title: "x".repeat(81) }).title).toBeTruthy();
    expect(validateStep("identity", { ...OK, tagline: "x".repeat(101) }).tagline).toBeTruthy();
  });

  it("classification requires a known category", () => {
    expect(validateStep("classification", EMPTY_FORM).category).toBeTruthy();
    expect(validateStep("classification", { ...OK, category: "web-apps" })).toEqual({});
  });

  it("details enforces 30+ chars and 3–5 features", () => {
    expect(validateStep("details", EMPTY_FORM).description).toBeTruthy();
    expect(validateStep("details", { ...OK, features: ["a", "b"] }).features).toBeTruthy();
    expect(validateStep("details", OK)).toEqual({});
  });

  it("media is optional but validates video URL shape", () => {
    expect(validateStep("media", EMPTY_FORM)).toEqual({});
    expect(
      validateStep("media", { ...OK, videoUrl: "youtube.com/watch" }).videoUrl,
    ).toBeTruthy();
  });

  it("pricing validates model + license + discount pairs", () => {
    // "free" + "commercial-attribution" are the DEFAULTS, already valid.
    expect(validateStep("pricing", EMPTY_FORM)).toEqual({});
    const badDiscount = validateStep("pricing", {
      ...OK,
      discountEnabled: true,
      discountCode: "",
      discountPercent: "",
    });
    expect(badDiscount.discount).toBeTruthy();
    expect(validateStep("pricing", OK)).toEqual({});
  });

  it("creator requires handle, valid links and email", () => {
    // senderRole defaults to "creator", so only the other fields fail.
    expect(Object.keys(validateStep("creator", EMPTY_FORM))).toEqual(
      expect.arrayContaining(["authorHandle", "contactEmail"]),
    );
    expect(
      validateStep("creator", { ...OK, authorLinks: ["no-es-url"] }).authorLinks,
    ).toBeTruthy();
    expect(validateStep("creator", OK)).toEqual({});
  });

  it("review has no own fields", () => {
    expect(validateStep("review", EMPTY_FORM)).toEqual({});
  });
});

describe("stepCompletion", () => {
  it("counts required fields per step", () => {
    const c = stepCompletion(EMPTY_FORM);
    expect(c.identity.missing).toBe(3);
    expect(c.classification.missing).toBe(1);
    expect(c.details.missing).toBe(2);
    expect(c.pricing.missing).toBe(0); // defaults free + commercial-attribution are valid
    expect(c.creator.missing).toBe(2); // senderRole defaults valid; handle + email remain (empty links pass)
    expect(c.media.done).toBe(true); // optional step
  });

  it("is all done for a complete form", () => {
    const c = stepCompletion(OK);
    expect(c.identity.done).toBe(true);
    expect(c.classification.done).toBe(true);
    expect(c.details.done).toBe(true);
    expect(c.pricing.done).toBe(true);
    expect(c.creator.done).toBe(true);
  });
});

describe("normalizeUrl", () => {
  it("strips protocol variance, www and trailing slashes", () => {
    expect(normalizeUrl("https://www.Example.com/tool/")).toBe(
      "https://example.com/tool",
    );
    expect(normalizeUrl("http://example.com/tool")).toBe(
      "http://example.com/tool", // scheme is preserved, host/path normalized
    );
    expect(normalizeUrl("https://example.com:443/tool")).toBe(
      "https://example.com/tool",
    );
    expect(normalizeUrl("")).toBe("");
  });

  it("keeps query strings for tools that need them", () => {
    expect(normalizeUrl("https://example.com/app?id=7")).toBe(
      "https://example.com/app?id=7",
    );
  });
});

describe("isBlockedHost", () => {
  it("blocks loopback and private ranges", () => {
    expect(isBlockedHost("http://localhost:3000/x")).toBe(true);
    expect(isBlockedHost("http://127.0.0.1/x")).toBe(true);
    expect(isBlockedHost("http://10.0.0.4/x")).toBe(true);
    expect(isBlockedHost("http://192.168.1.10/x")).toBe(true);
    expect(isBlockedHost("http://172.16.0.9/x")).toBe(true);
    expect(isBlockedHost("http://169.254.169.254/latest/meta-data")).toBe(true);
    expect(isBlockedHost("http://[::1]/x")).toBe(true);
  });

  it("allows public URLs and handles garbage", () => {
    expect(isBlockedHost("https://example.com")).toBe(false);
    expect(isBlockedHost("https://8.8.8.8/x")).toBe(false);
    expect(isBlockedHost("not a url")).toBe(true);
  });
});

describe("formatRef + hydrateForm", () => {
  it("builds #ML-XXXX from the real backend id", () => {
    expect(formatRef("jd7k2m9abcd12")).toBe("#ML-CD12");
  });

  it("hydrates drafts defensively", () => {
    expect(hydrateForm(null)).toEqual(EMPTY_FORM);
    expect(hydrateForm({ features: ["only"] }).features).toEqual(["", "", ""]);
    expect(hydrateForm({ platforms: undefined }).platforms).toEqual([]);
    expect(hydrateForm(OK).title).toBe(OK.title);
  });
});

afterEach(() => {
  // No DOM used; keep symmetry with component tests.
});
