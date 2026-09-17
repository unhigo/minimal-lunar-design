import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  uploadImage,
  readImageDimensions,
  MAX_IMAGE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from "./upload";

/** Build a File with the given type/size without real image data. */
function makeFile(type: string, size: number): File {
  const data = new Uint8Array(Math.max(1, Math.min(size, 1024)));
  const ext = type.split("/")[1]?.replace("+xml", "") ?? "bin";
  return new File([data], `test.${ext}`, { type });
}

import type { UploadedImage } from "./upload";
import type { Id } from "@/convex/_generated/dataModel";

const okUpload: UploadedImage = {
  storageId: "stub-id" as Id<"_storage">,
  name: "stub",
  type: "image/png",
  size: 1,
  width: 1,
  height: 1,
};

describe("uploadImage — client-side validation", () => {
  it("rejects disallowed file types before contacting Convex", async () => {
    const generateUploadUrl = vi.fn();
    const attach = vi.fn();
    const file = makeFile("application/pdf", 10);

    await expect(uploadImage(generateUploadUrl, attach, file)).rejects.toThrow(
      "Formato no permitido",
    );
    expect(generateUploadUrl).not.toHaveBeenCalled();
    expect(attach).not.toHaveBeenCalled();
  });

  it("rejects files above MAX_IMAGE_BYTES", async () => {
    const generateUploadUrl = vi.fn();
    const attach = vi.fn();
    const file = makeFile("image/png", MAX_IMAGE_BYTES + 1);
    // makeFile caps data at 1KB; force the reported size instead.
    Object.defineProperty(file, "size", { value: MAX_IMAGE_BYTES + 1 });

    await expect(uploadImage(generateUploadUrl, attach, file)).rejects.toThrow(
      "supera el límite",
    );
    expect(generateUploadUrl).not.toHaveBeenCalled();
  });

  it("accepts every type listed in ACCEPTED_IMAGE_TYPES", async () => {
    const generateUploadUrl = vi.fn(async () => "https://upload.example");
    const attach = vi.fn(async () => okUpload);
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ storageId: "stub-id" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }),
    );
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth = 0;
        naturalHeight = 0;
        set src(_: string) {
          // Simulate a successful decode.
          queueMicrotask(() => {
            this.naturalWidth = 12;
            this.naturalHeight = 34;
            this.onload?.();
          });
        }
      },
    );

    try {
      for (const type of ACCEPTED_IMAGE_TYPES) {
        const file = makeFile(type, 32);
        const result = await uploadImage(generateUploadUrl, attach, file);
        expect(result.storageId).toBe("stub-id");
      }
      expect(attach).toHaveBeenCalledTimes(ACCEPTED_IMAGE_TYPES.length);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("surfaces an error when the storage POST fails", async () => {
    const generateUploadUrl = vi.fn(async () => "https://upload.example");
    const attach = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    try {
      const file = makeFile("image/png", 10);
      await expect(
        uploadImage(generateUploadUrl, attach, file),
      ).rejects.toThrow("La subida falló");
      expect(attach).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("readImageDimensions", () => {
  let originalImage: unknown;

  beforeEach(() => {
    originalImage = globalThis.Image;
  });

  afterEach(() => {
    (globalThis as { Image: unknown }).Image = originalImage;
  });

  it("resolves with natural dimensions on load", async () => {
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }),
    );
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth = 640;
        naturalHeight = 480;
        set src(_: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    const dims = await readImageDimensions(makeFile("image/png", 8));
    expect(dims).toEqual({ width: 640, height: 480 });
    vi.unstubAllGlobals();
  });

  it("rejects when the image cannot be decoded", async () => {
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }),
    );
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );

    await expect(readImageDimensions(makeFile("image/png", 8))).rejects.toThrow(
      "No se pudo leer",
    );
    vi.unstubAllGlobals();
  });
});
