/**
 * Block registry — the single source of truth describing every content block
 * the lab supports on a resource page.
 *
 * This mirrors the server-side rules in `src/convex/blocks.ts` (block types,
 * per-resource and per-block limits). A unit test keeps both files in sync;
 * if you change a limit in blocks.ts, update it here too.
 */

export type BlockType = "image" | "video" | "text" | "gallery" | "slider";

export interface BlockDef {
  /** Unique, stable identifier (the `type` stored on resourceBlocks). */
  id: BlockType;
  /** Human name shown in pickers and the design system. */
  name: string;
  category: "media" | "content";
  description: string;
  /** What the block needs to be valid (mirrors validateBlockContent). */
  requires: string;
  /** Accepted upload MIME families (mirrors files.ts rules). */
  accepts: string;
  variants: string[];
  states: string[];
  /** Server-enforced constraints. */
  limits: Record<string, string>;
}

/** Enforced in src/convex/blocks.ts — keep in sync (see block-registry.test). */
export const BLOCK_LIMITS = {
  maxBlocksPerResource: 60,
  maxTextLength: 4_000,
  maxCaptionLength: 280,
} as const;

export const BLOCK_REGISTRY: BlockDef[] = [
  {
    id: "image",
    name: "Imagen",
    category: "media",
    description: "Una imagen con proporción configurable y pie opcional.",
    requires: "storageId (subida validada)",
    accepts: "PNG · JPEG · WebP · GIF · SVG (≤ 8 MB)",
    variants: ["ratio libre", "ratio fija"],
    states: ["default", "hover", "caption", "removed"],
    limits: { "tamaño máx.": "8 MB", "pie máx.": `${BLOCK_LIMITS.maxCaptionLength} car.` },
  },
  {
    id: "video",
    name: "Vídeo",
    category: "media",
    description: "Vídeo subido o embebido por URL, con opciones de reproducción.",
    requires: "storageId o url",
    accepts: "MP4 · WebM (≤ 8 MB) o URL externa",
    variants: ["autoplay", "loop", "muted"],
    states: ["default", "playing", "paused"],
    limits: { "tamaño máx.": "8 MB" },
  },
  {
    id: "text",
    name: "Texto",
    category: "content",
    description: "Nota o párrafo editable por cualquier colaborador del lab.",
    requires: "texto no vacío",
    accepts: "texto plano",
    variants: ["nota", "descripción"],
    states: ["default", "editing", "saved"],
    limits: { "máx.": `${BLOCK_LIMITS.maxTextLength.toLocaleString("es")} car.` },
  },
  {
    id: "gallery",
    name: "Galería",
    category: "media",
    description: "Conjunto ordenado de imágenes con proporción común.",
    requires: "storageId o url (elementos)",
    accepts: "PNG · JPEG · WebP · GIF · SVG",
    variants: ["ratio 1:1", "ratio 4:3", "ratio 16:9"],
    states: ["default", "hover", "selected"],
    limits: {},
  },
  {
    id: "slider",
    name: "Slider",
    category: "media",
    description: "Carrusel navegable de imágenes con proporción fija.",
    requires: "storageId o url (elementos)",
    accepts: "PNG · JPEG · WebP · GIF · SVG",
    variants: ["ratio 1:1", "ratio 16:9"],
    states: ["default", "dragging", "end"],
    limits: {},
  },
];

export function getBlockDef(type: string): BlockDef | undefined {
  return BLOCK_REGISTRY.find((b) => b.id === type);
}
