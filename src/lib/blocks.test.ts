import { describe, expect, it } from "vitest";
import {
  groupBlocks,
  isEmbedVideoUrl,
  ratioValue,
  youtubeEmbedUrl,
} from "./blocks";
import type { ResourceBlock } from "./blocks";

/** Minimal block factory — only the fields the helpers read. */
function block(partial: Partial<ResourceBlock>): ResourceBlock {
  return {
    _id: partial._id ?? "b1",
    resourceId: "r1" as ResourceBlock["resourceId"],
    authorId: "u1" as ResourceBlock["authorId"],
    type: partial.type ?? "image",
    order: partial.order ?? 0,
    url: partial.url ?? null,
    text: partial.text,
    meta: partial.meta,
    createdAt: 1,
  };
}

describe("ratioValue", () => {
  it("keeps known ratios", () => {
    expect(ratioValue("4/3")).toBe("4/3");
    expect(ratioValue("21/9")).toBe("21/9");
  });

  it("defaults unknown or missing ratios to 16/9", () => {
    expect(ratioValue(undefined)).toBe("16/9");
    expect(ratioValue("9/16")).toBe("16/9");
  });
});

describe("youtubeEmbedUrl", () => {
  it("parses watch urls", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("parses youtu.be short links and shorts", () => {
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(
      youtubeEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("accepts a bare 11-char id", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("rejects non-youtube urls and malformed ids", () => {
    expect(youtubeEmbedUrl("https://vimeo.com/12345")).toBeNull();
    expect(youtubeEmbedUrl("https://example.com/video.mp4")).toBeNull();
    expect(youtubeEmbedUrl("short-id")).toBeNull();
  });
});

describe("isEmbedVideoUrl", () => {
  it("detects youtube links", () => {
    expect(isEmbedVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isEmbedVideoUrl("https://cdn.example.com/clip.mp4")).toBe(false);
  });
});

describe("groupBlocks", () => {
  it("returns an empty list for empty input", () => {
    expect(groupBlocks([])).toEqual([]);
  });

  it("wraps single blocks individually, preserving order", () => {
    const blocks = [
      block({ _id: "a", type: "image", order: 0 }),
      block({ _id: "b", type: "text", order: 1 }),
      block({ _id: "c", type: "video", order: 2 }),
    ];
    expect(groupBlocks(blocks)).toEqual([
      { kind: "single", type: "image", blocks: [blocks[0]] },
      { kind: "single", type: "text", blocks: [blocks[1]] },
      { kind: "single", type: "video", blocks: [blocks[2]] },
    ]);
  });

  it("merges consecutive gallery blocks into one grid group", () => {
    const blocks = [
      block({ _id: "a", type: "image", order: 0 }),
      block({ _id: "g1", type: "gallery", order: 1 }),
      block({ _id: "g2", type: "gallery", order: 2 }),
      block({ _id: "g3", type: "gallery", order: 3 }),
    ];
    expect(groupBlocks(blocks)).toEqual([
      { kind: "single", type: "image", blocks: [blocks[0]] },
      { kind: "gallery", blocks: [blocks[1], blocks[2], blocks[3]] },
    ]);
  });

  it("merges consecutive slider blocks but separates non-adjacent runs", () => {
    const blocks = [
      block({ _id: "s1", type: "slider", order: 0 }),
      block({ _id: "s2", type: "slider", order: 1 }),
      block({ _id: "x", type: "text", order: 2 }),
      block({ _id: "s3", type: "slider", order: 3 }),
    ];
    expect(groupBlocks(blocks)).toEqual([
      { kind: "slider", blocks: [blocks[0], blocks[1]] },
      { kind: "single", type: "text", blocks: [blocks[2]] },
      { kind: "slider", blocks: [blocks[3]] },
    ]);
  });
});
