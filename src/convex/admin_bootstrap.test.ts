import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_BOOTSTRAP_FLAG, timingSafeEqual } from "./admin_bootstrap";

describe("admin bootstrap — secret comparison (P0 security)", () => {
  it("accepts the exact expected secret", () => {
    expect(timingSafeEqual("correct-horse-battery", "correct-horse-battery")).toBe(true);
  });

  it("denies a wrong secret", () => {
    expect(timingSafeEqual("wrong", "correct-horse-battery")).toBe(false);
    expect(timingSafeEqual("correct-horse-batterY", "correct-horse-battery")).toBe(false);
    expect(timingSafeEqual("correct-horse-battery ", "correct-horse-battery")).toBe(false);
  });

  it("denies secrets of different length (no crash, no leak)", () => {
    expect(timingSafeEqual("", "secret")).toBe(false);
    expect(timingSafeEqual("short", "a-much-longer-expected-value")).toBe(false);
    expect(timingSafeEqual("a-much-longer-attempt-value", "x")).toBe(false);
  });

  it("denies empty vs configured", () => {
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("s", "")).toBe(false);
  });

  it("latch key is namespaced and stable", () => {
    expect(ADMIN_BOOTSTRAP_FLAG).toBe("admin.bootstrap.used");
  });
});

describe("secret hygiene (P0 security)", () => {
  const backendRoot = resolve(__dirname);

  it("the old hardcoded bootstrap secret no longer appears in the backend", () => {
    const files = [
      "resources.ts",
      "tools.ts",
      "files.ts",
      "submissions.ts",
      "admin_bootstrap.ts",
      "schema.ts",
    ];
    for (const f of files) {
      const src = readFileSync(resolve(backendRoot, f), "utf8");
      expect(src, `${f} must not contain the hardcoded secret`).not.toContain(
        "luna-admin-bootstrap",
      );
      expect(src, `${f} must not declare BOOTSTRAP_SECRET constants`).not.toMatch(
        /BOOTSTRAP_SECRET\s*=\s*"/,
      );
    }
  });

  it("the bootstrap mutation reads the secret from server env only", () => {
    const src = readFileSync(resolve(backendRoot, "resources.ts"), "utf8");
    expect(src).toContain("process.env.ADMIN_BOOTSTRAP_SECRET");
    expect(src).not.toMatch(/export const (BOOTSTRAP_SECRET|ADMIN_SECRET)/);
  });
});
