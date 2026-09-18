import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "./files";

/**
 * Resource content blocks — the open-lab layer.
 *
 * Any signed-in user can compose a resource page: upload new images,
 * embed videos, write notes, build galleries and sliders. Blocks are stored
 * separately from the resource itself so the original author's fields stay
 * untouched and every contribution stays attributable and removable.
 */

const BLOCK_TYPES = [
  "image",
  "video",
  "text",
  "gallery",
  "slider",
] as const;

/** Max blocks per resource — keeps pages light without hard-coding a page. */
export const MAX_BLOCKS_PER_RESOURCE = 60;
/** Max characters for a text block. */
export const MAX_TEXT_LENGTH = 4_000;
/** Max characters for a caption. */
export const MAX_CAPTION_LENGTH = 280;

const metaValidator = v.object({
  name: v.optional(v.string()),
  type: v.optional(v.string()),
  size: v.optional(v.number()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  caption: v.optional(v.string()),
  ratio: v.optional(v.string()),
  autoplay: v.optional(v.boolean()),
  loop: v.optional(v.boolean()),
  muted: v.optional(v.boolean()),
});

function validateBlockContent(
  type: string,
  storageId: Id<"_storage"> | undefined,
  url: string | undefined,
  text: string | undefined,
) {
  const has =
    (type === "image" && storageId !== undefined) ||
    (type === "video" && (storageId !== undefined || !!url)) ||
    (type === "text" && !!text && text.trim().length > 0) ||
    ((type === "gallery" || type === "slider") && (storageId !== undefined || !!url));
  if (!has) throw new Error("El bloque necesita contenido (archivo, enlace o texto).");
  if (type === "text" && text && text.length > MAX_TEXT_LENGTH) {
    throw new Error(`El texto supera ${MAX_TEXT_LENGTH} caracteres.`);
  }
}

async function requireSignedIn(ctx: {
  auth: { getUserIdentity: unknown };
  db: unknown;
}): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx as never);
  if (userId === null) throw new Error("Inicia sesión para colaborar.");
  return userId as Id<"users">;
}

export const list = query({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, { resourceId }) => {
    const blocks = await ctx.db
      .query("resourceBlocks")
      .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
      .collect();
    blocks.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
    return await Promise.all(
      blocks.map(async (b) => ({
        ...b,
        url: b.storageId ? await ctx.storage.getUrl(b.storageId) : b.url ?? null,
      })),
    );
  },
});

export const add = mutation({
  args: {
    resourceId: v.id("resources"),
    type: v.union(...BLOCK_TYPES.map((t) => v.literal(t))),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    text: v.optional(v.string()),
    meta: v.optional(metaValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireSignedIn(ctx);
    const { resourceId, type, storageId, url, text, meta } = args;

    const resource = await ctx.db.get(resourceId);
    if (!resource) throw new Error("El recurso no existe.");

    if (storageId !== undefined) {
      const file = await ctx.db.system.get("_storage", storageId);
      if (!file) throw new Error("El archivo no existe en el almacenamiento.");
      const isVideo = type === "video";
      const allowed = isVideo
        ? ALLOWED_IMAGE_TYPES.includes(file.contentType ?? "") ||
          file.contentType === "video/mp4" ||
          file.contentType === "video/webm"
        : ALLOWED_IMAGE_TYPES.includes(file.contentType ?? "");
      if (!allowed) {
        await ctx.storage.delete(storageId);
        throw new Error(
          isVideo
            ? "Formato no permitido. Usa imagen (PNG, JPEG, WebP, GIF, SVG) o video (MP4, WebM)."
            : "Formato no permitido. Usa PNG, JPEG, WebP, GIF o SVG.",
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        await ctx.storage.delete(storageId);
        throw new Error("El archivo supera el límite de 8 MB.");
      }
    }

    const existing = await ctx.db
      .query("resourceBlocks")
      .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
      .collect();
    if (existing.length >= MAX_BLOCKS_PER_RESOURCE) {
      throw new Error(
        `Este recurso ya alcanzó el máximo de ${MAX_BLOCKS_PER_RESOURCE} bloques.`,
      );
    }
    const order =
      existing.length === 0 ? 0 : Math.max(...existing.map((b) => b.order)) + 1;

    validateBlockContent(type, storageId, url, text);

    return await ctx.db.insert("resourceBlocks", {
      resourceId,
      authorId: userId,
      type,
      order,
      storageId,
      url: url || undefined,
      text: text || undefined,
      meta,
      createdAt: Date.now(),
    });
  },
});

/** Move a block to a new position (0-based) and compact sibling order. */
export const move = mutation({
  args: { id: v.id("resourceBlocks"), to: v.number() },
  handler: async (ctx, { id, to }) => {
    await requireSignedIn(ctx);
    const block = await ctx.db.get(id);
    if (!block) throw new Error("El bloque no existe.");

    const siblings = await ctx.db
      .query("resourceBlocks")
      .withIndex("by_resource", (q) => q.eq("resourceId", block.resourceId))
      .collect();
    siblings.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
    const clamped = Math.max(0, Math.min(to, siblings.length - 1));
    const current = siblings.findIndex((b) => b._id === id);
    if (current === -1 || current === clamped) return;
    siblings.splice(clamped, 0, siblings.splice(current, 1)[0]);
    await Promise.all(
      siblings.map((b, i) =>
        b.order === i ? Promise.resolve() : ctx.db.patch(b._id, { order: i }),
      ),
    );
  },
});

/** Update editable properties: caption, media options or text content. */
export const update = mutation({
  args: {
    id: v.id("resourceBlocks"),
    text: v.optional(v.string()),
    caption: v.optional(v.string()),
    ratio: v.optional(v.string()),
    autoplay: v.optional(v.boolean()),
    loop: v.optional(v.boolean()),
    muted: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...props }) => {
    await requireSignedIn(ctx);
    const block = await ctx.db.get(id);
    if (!block) throw new Error("El bloque no existe.");

    if (props.text !== undefined) {
      if (block.type !== "text") {
        throw new Error("Solo los bloques de texto aceptan contenido textual.");
      }
      const text = props.text.trim();
      if (!text) throw new Error("El texto no puede quedar vacío; elimina el bloque.");
      if (text.length > MAX_TEXT_LENGTH) {
        throw new Error(`El texto supera ${MAX_TEXT_LENGTH} caracteres.`);
      }
      await ctx.db.patch(id, { text });
      return;
    }

    const meta = { ...(block.meta ?? {}) };
    if (props.caption !== undefined) {
      const caption = props.caption.trim();
      if (caption.length > MAX_CAPTION_LENGTH) {
        throw new Error(`El pie supera ${MAX_CAPTION_LENGTH} caracteres.`);
      }
      if (caption) meta.caption = caption;
      else delete meta.caption;
    }
    if (props.ratio !== undefined) {
      if (block.type === "gallery" || block.type === "slider") meta.ratio = props.ratio;
      else throw new Error("Solo galerías y sliders aceptan proporción.");
    }
    const media = ["video"] as const;
    if (props.autoplay !== undefined || props.loop !== undefined || props.muted !== undefined) {
      if (!media.includes(block.type as "video")) {
        throw new Error("Solo los bloques de video aceptan opciones de reproducción.");
      }
      if (props.autoplay !== undefined) meta.autoplay = props.autoplay;
      if (props.loop !== undefined) meta.loop = props.loop;
      if (props.muted !== undefined) meta.muted = props.muted;
    }
    await ctx.db.patch(id, { meta });
  },
});

/** Delete a block and its uploaded blob (when it owns one). */
export const remove = mutation({
  args: { id: v.id("resourceBlocks") },
  handler: async (ctx, { id }) => {
    await requireSignedIn(ctx);
    const block = await ctx.db.get(id);
    if (!block) throw new Error("El bloque no existe.");
    if (block.storageId) await ctx.storage.delete(block.storageId);
    await ctx.db.delete(id);

    // Compact remaining order values so gaps never accumulate.
    const rest = await ctx.db
      .query("resourceBlocks")
      .withIndex("by_resource", (q) => q.eq("resourceId", block.resourceId))
      .collect();
    rest.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
    await Promise.all(
      rest.map((b, i) =>
        b.order === i ? Promise.resolve() : ctx.db.patch(b._id, { order: i }),
      ),
    );
  },
});
