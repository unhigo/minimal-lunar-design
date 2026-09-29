/**
 * Cloudinary integration — image/CDN layer for MOONØ.LAB media.
 *
 * Architecture (no parallel pipeline, rides the existing one):
 * - Client asks `cloudinary.signUpload` for a short-TTL signature.
 * - Client POSTs the file DIRECTLY to Cloudinary (browser → CDN edge),
 *   so file bytes never round-trip through the Convex action.
 * - The asset lands in the `moono` folder with `moono/` prefix; the client
 *   stores { url, publicId } alongside the existing storageId fields.
 * - Deletion/replacement cleanup runs server-side via `destroyMany`
 *   (API secret never leaves the server).
 *
 * Env vars (set in the project Keys tab, read with process.env here):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
} from "cloudinary";

/** Configure the SDK from individual env vars (Keys tab) — never hardcoded. */
function configureCloudinary(): string | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudName;
}

/** Upload params we sign. Anything unsigned a client sends is ignored. */
const SIGN_PARAMS = {
  folder: "moono",
  allowed_formats: "png,jpg,jpeg,webp,gif,svg",
} as const;

export const signUpload = action({
  args: {},
  handler: async (ctx): Promise<
    | { ok: true; cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string }
    | { ok: false; error: string }
  > => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { ok: false, error: "Inicia sesión para subir imágenes." };
    }
    if (!configureCloudinary()) {
      return { ok: false, error: "Cloudinary no está configurado." };
    }
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { ...SIGN_PARAMS, timestamp },
      process.env.CLOUDINARY_API_SECRET as string,
    );
    return {
      ok: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
      apiKey: process.env.CLOUDINARY_API_KEY as string,
      timestamp,
      signature,
      folder: SIGN_PARAMS.folder,
    };
  },
});

/** Permanently delete Cloudinary assets (replace/remove cleanup). */
export const destroyMany = action({
  args: { publicIds: v.array(v.string()) },
  handler: async (ctx, { publicIds }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Inicia sesión.");
    if (!configureCloudinary()) return { destroyed: [] as string[] };

    const destroyed: string[] = [];
    for (const publicId of publicIds.slice(0, 10)) {
      // Validate shape: Cloudinary public ids are path-ish strings.
      if (!/^[a-zA-Z0-9_\-/.]+$/.test(publicId)) continue;
      try {
        const res = await cloudinary.uploader.destroy(publicId);
        if (res.result === "ok" || res.result === "not found") {
          destroyed.push(publicId);
        }
      } catch (err) {
        const e = err as UploadApiErrorResponse;
        if (e.http_code && e.http_code >= 500) {
          throw new Error(`Cloudinary: ${e.message}`);
        }
        // 4xx per-asset failures (e.g. already gone) don't abort the batch.
      }
    }
    return { destroyed };
  },
});
