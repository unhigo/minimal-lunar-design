import type { Id } from "@/convex/_generated/dataModel";

/**
 * Client-side types and helpers for resource content blocks.
 * Mirrors the Convex `resourceBlocks` table (src/convex/blocks.ts) with the
 * media `url` already resolved (storage URL or external link).
 */

export type BlockType = "image" | "video" | "text" | "gallery" | "slider";

export interface BlockMeta {
  name?: string;
  type?: string;
  size?: number;
  width?: number;
  height?: number;
  caption?: string;
  ratio?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

/** A block as returned by `api.blocks.list` (media url already resolved). */
export interface ResourceBlock {
  _id: string;
  resourceId: Id<"resources">;
  authorId: Id<"users">;
  type: BlockType;
  order: number;
  storageId?: Id<"_storage">;
  url: string | null;
  text?: string;
  meta?: BlockMeta;
  createdAt: number;
}

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  image: "Imagen",
  video: "Video",
  text: "Nota",
  gallery: "Galería",
  slider: "Slider",
};

/** Validation limits mirrored from src/convex/blocks.ts. */
export const MAX_BLOCKS_PER_RESOURCE = 60;
export const MAX_TEXT_LENGTH = 4_000;
export const MAX_CAPTION_LENGTH = 280;
export const MAX_BLOCK_BYTES = 8 * 1024 * 1024;

/** Accept strings for hidden file inputs. */
export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
export const VIDEO_ACCEPT = "video/mp4,video/webm";

export const ASPECT_RATIOS = [
  { value: "16/9", label: "16:9" },
  { value: "4/3", label: "4:3" },
  { value: "1/1", label: "1:1" },
  { value: "3/4", label: "3:4" },
  { value: "21/9", label: "21:9" },
] as const;

/** CSS aspect-ratio value for a stored ratio (defaults to 16/9). */
export function ratioValue(ratio: string | undefined): string {
  return ASPECT_RATIOS.some((r) => r.value === ratio) ? ratio! : "16/9";
}

/**
 * Resolve a YouTube link or bare id into an embed URL.
 * Accepts watch URLs, youtu.be short links, /shorts/ and 11-char ids.
 */
export function youtubeEmbedUrl(raw: string): string | null {
  const value = raw.trim();
  const idMatch = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (idMatch) return `https://www.youtube.com/embed/${idMatch[1]}`;
  if (/^[\w-]{11}$/.test(value)) {
    return `https://www.youtube.com/embed/${value}`;
  }
  return null;
}

/** True when a video block url is an embeddable player page, not a file. */
export function isEmbedVideoUrl(url: string): boolean {
  return url.includes("/embed/") || url.includes("youtube.com") || url.includes("youtu.be");
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isMediaBlock(type: BlockType): boolean {
  return type !== "text";
}

// ---------------------------------------------------------------------------
// Grouping — consecutive gallery blocks merge into one grid, consecutive
// slider blocks into one carousel. Everything else renders standalone.
// ---------------------------------------------------------------------------

export type BlockGroup =
  | { kind: "single"; type: BlockType; blocks: [ResourceBlock] }
  | { kind: "gallery"; blocks: ResourceBlock[] }
  | { kind: "slider"; blocks: ResourceBlock[] };

export function groupBlocks(blocks: ResourceBlock[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i]!;
    if (block.type === "gallery" || block.type === "slider") {
      const kind = block.type;
      const run: ResourceBlock[] = [];
      while (i < blocks.length && blocks[i]!.type === kind) {
        run.push(blocks[i]!);
        i++;
      }
      groups.push(kind === "gallery" ? { kind: "gallery", blocks: run } : { kind: "slider", blocks: run });
    } else {
      groups.push({ kind: "single", type: block.type, blocks: [block] });
      i++;
    }
  }
  return groups;
}
