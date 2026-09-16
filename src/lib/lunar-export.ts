import { lunarSvgString, type LunarState } from "./lunar";

const RESOLUTIONS: Record<string, number> = {
  HD: 1280,
  "2K": 2048,
  "4K": 3840,
  "8K": 7680,
};

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSvg(state: LunarState, filename: string) {
  const blob = new Blob([lunarSvgString(state)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function rasterize(
  state: LunarState,
  resolution: string,
  filename: string,
  type: "png" | "jpeg" | "webp",
  quality = 1.0,
): Promise<void> {
  const w = RESOLUTIONS[resolution] ?? 1280;
  const blob = new Blob([lunarSvgString(state)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG rasterization failed"));
      img.src = url;
    });
    const ar =
      img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
    const h = Math.round(w / ar);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    if (state.bgColor && state.bgColor !== "transparent") {
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    triggerDownload(canvas.toDataURL(`image/${type}`, quality), filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportPng(
  state: LunarState,
  resolution: string,
  filename: string,
) {
  await rasterize(state, resolution, filename, "png");
}

export async function exportJpg(
  state: LunarState,
  resolution: string,
  filename: string,
) {
  await rasterize(state, resolution, filename, "jpeg", 0.95);
}

export async function exportWebp(
  state: LunarState,
  resolution: string,
  filename: string,
) {
  await rasterize(state, resolution, filename, "webp", 0.95);
}
