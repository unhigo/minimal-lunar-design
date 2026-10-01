import { describe, expect, it } from "vitest";
import {
  BLOCK_LIMITS,
  BLOCK_REGISTRY,
  getBlockDef,
} from "./block-registry";
import {
  MAX_BLOCKS_PER_RESOURCE,
  MAX_TEXT_LENGTH,
  MAX_CAPTION_LENGTH,
} from "../convex/blocks";

describe("block registry ↔ server limits", () => {
  it("registry limits mirror convex/blocks.ts constants", () => {
    expect(BLOCK_LIMITS.maxBlocksPerResource).toBe(MAX_BLOCKS_PER_RESOURCE);
    expect(BLOCK_LIMITS.maxTextLength).toBe(MAX_TEXT_LENGTH);
    expect(BLOCK_LIMITS.maxCaptionLength).toBe(MAX_CAPTION_LENGTH);
  });

  it("covers exactly the block types the backend accepts", () => {
    expect(BLOCK_REGISTRY.map((b) => b.id)).toEqual([
      "image",
      "video",
      "text",
      "gallery",
      "slider",
    ]);
  });

  it("every block has a unique id and required metadata", () => {
    const ids = new Set(BLOCK_REGISTRY.map((b) => b.id));
    expect(ids.size).toBe(BLOCK_REGISTRY.length);
    for (const b of BLOCK_REGISTRY) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
      expect(b.requires.length).toBeGreaterThan(0);
    }
  });

  it("getBlockDef resolves known types and rejects unknown ones", () => {
    expect(getBlockDef("image")?.name).toBe("Imagen");
    expect(getBlockDef("nope")).toBeUndefined();
  });
});
