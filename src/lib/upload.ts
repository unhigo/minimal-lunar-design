import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/** Max image size accepted by the Convex `files.attach` validator. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export interface UploadedImage {
  storageId: Id<"_storage">;
  name: string;
  type: string;
  size: number;
  width: number | null;
  height: number | null;
}

/**
 * Upload an image through Convex storage and validate it server-side.
 * Pipeline: generateUploadUrl → POST blob → attach (validates type/size).
 */
export async function uploadImage(
  generateUploadUrl: (args: {}) => Promise<string>,
  attach: (args: {
    storageId: Id<"_storage">;
    width?: number;
    height?: number;
  }) => Promise<UploadedImage>,
  file: File,
): Promise<UploadedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato no permitido. Usa PNG, JPEG, WebP, GIF o SVG.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen supera el límite de 8 MB.");
  }

  const uploadUrl = await generateUploadUrl({});
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!result.ok) {
    throw new Error("La subida falló. Inténtalo de nuevo.");
  }
  const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };

  const dims = await readImageDimensions(file).catch(() => null);
  return await attach({
    storageId,
    width: dims?.width,
    height: dims?.height,
  });
}

/** Reads intrinsic pixel dimensions of an image file (best effort). */
export function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}
