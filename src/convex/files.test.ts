import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES } from "./files";

describe("files.ts storage rules", () => {
  it("caps file size at 8 MB", () => {
    expect(MAX_IMAGE_BYTES).toBe(8 * 1024 * 1024);
  });

  it("accepts common raster and vector image types", () => {
    for (const type of [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ]) {
      expect(ALLOWED_IMAGE_TYPES).toContain(type);
    }
    expect(ALLOWED_IMAGE_TYPES).not.toContain("application/pdf");
  });
});
