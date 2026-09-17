import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Image upload pipeline over Convex file storage.
 *
 * Flow: client asks for a short-lived upload URL (generateUploadUrl),
 * POSTs the file there, then calls `attach` with the returned storage id.
 * `attach` validates MIME type and size and stamps width/height so the UI
 * can size thumbnails without decoding the image.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Inicia sesión para subir archivos.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const attach = mutation({
  args: {
    storageId: v.id("_storage"),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, { storageId, width, height }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Inicia sesión para subir archivos.");

    const file = await ctx.db.system.get("_storage", storageId);
    if (!file) throw new Error("El archivo no existe en el almacenamiento.");
    const contentType = file.contentType ?? "application/octet-stream";
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      // Clean up the orphan blob before failing.
      await ctx.storage.delete(storageId);
      throw new Error("Formato no permitido. Usa PNG, JPEG, WebP, GIF o SVG.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      await ctx.storage.delete(storageId);
      throw new Error("La imagen supera el límite de 8 MB.");
    }

    return {
      storageId,
      name: "imagen",
      type: contentType,
      size: file.size,
      width: width ?? null,
      height: height ?? null,
    };
  },
});

/** Public URL for an image stored in Convex storage. No auth required. */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

/** Permanently delete an image blob (used when replacing/removing covers). */
export const clearFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Inicia sesión.");
    await ctx.storage.delete(storageId);
  },
});
