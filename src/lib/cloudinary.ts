/**
 * Cloudinary client-side upload — direct signed browser upload.
 *
 * Flow: `api.cloudinary.signUpload` (Convex action, server holds the secret)
 * → POST the file straight to Cloudinary → store { url, publicId } next to
 * the existing Convex storageId. Falls back to the Convex storage pipeline
 * automatically when Cloudinary is not configured or the upload fails.
 *
 * Cloudinary assets land in the `moono/` folder with format restrictions,
 * so signed uploads keep the same rules as `files.attach` (MIME + 8 MB).
 */

import { api } from "@/convex/_generated/api";
import type { UploadedImage } from "@/lib/upload";

/** Client-side guard, mirrors the server-side SIGN_PARAMS allowlist. */
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — same limit as files.attach

export interface CloudUpload {
  url: string;
  publicId: string | null;
}

type Signer = (args: {}) => Promise<
  | { ok: true; cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string }
  | { ok: false; error: string }
>;

/**
 * Upload one image to Cloudinary via a short-TTL signed payload.
 * Returns null when Cloudinary is not configured — the caller then falls
 * back to the Convex storage pipeline (single code path for the UI).
 */
export async function uploadToCloudinary(
  signUpload: Signer,
  file: File,
): Promise<CloudUpload | null> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato no permitido. Usa PNG, JPEG, WebP, GIF o SVG.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen supera el límite de 8 MB.");
  }

  const signed = await signUpload({});
  if (!signed.ok) return null; // unconfigured — caller falls back

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", signed.signature);
  body.append("folder", signed.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body },
  );
  if (!res.ok) {
    throw new Error("La subida a Cloudinary falló. Inténtalo de nuevo.");
  }
  const data = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
  };
  if (!data.secure_url) {
    throw new Error("Cloudinary no devolvió URL.");
  }
  return { url: data.secure_url, publicId: data.public_id ?? null };
}

/**
 * Best of both: try Cloudinary first; on any failure or unconfigured state,
 * transparently use the existing Convex storage pipeline. The UI never
 * branches — the returned shape carries whichever ids are available.
 */
export async function uploadImageSmart(
  signUpload: Signer,
  generateUploadUrl: (args: {}) => Promise<string>,
  attach: (args: {
    storageId: import("@/convex/_generated/dataModel").Id<"_storage">;
    width?: number;
    height?: number;
  }) => Promise<UploadedImage>,
  file: File,
): Promise<
  | { kind: "cloud"; url: string; publicId: string | null }
  | { kind: "convex"; storageId: string; url: string }
> {
  try {
    const up = await uploadToCloudinary(signUpload, file);
    if (up) return { kind: "cloud", ...up };
  } catch {
    // fall through to the Convex pipeline
  }
  const { uploadImage } = await import("@/lib/upload");
  const convex = await uploadImage(generateUploadUrl, attach, file);
  return {
    kind: "convex",
    storageId: convex.storageId as unknown as string,
    url: URL.createObjectURL(file),
  };
}
