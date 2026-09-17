import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crop,
  Download,
  Loader2,
  RotateCcw,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

/**
 * Canvas image editor used before attaching an image to a resource.
 * Supports crop presets, free rotation, brightness/contrast/saturation,
 * and export to PNG/JPEG at full resolution.
 */

export interface EditedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
}

const CROP_PRESETS = [
  { id: "free", label: "Libre" },
  { id: "1:1", label: "1:1" },
  { id: "4:3", label: "4:3" },
  { id: "3:2", label: "3:2" },
  { id: "16:9", label: "16:9" },
] as const;

type CropId = (typeof CROP_PRESETS)[number]["id"];

interface Adjustments {
  brightness: number; // 100 = neutral
  contrast: number;
  saturation: number;
}

const NEUTRAL: Adjustments = { brightness: 100, contrast: 100, saturation: 100 };

function ratioOf(id: CropId): number | null {
  if (id === "1:1") return 1;
  if (id === "4:3") return 4 / 3;
  if (id === "3:2") return 3 / 2;
  if (id === "16:9") return 16 / 9;
  return null; // free
}

export default function ImageEditor({
  file,
  onClose,
  onSave,
}: {
  file: File;
  onClose: () => void;
  /** Receives the edited image (or null when the user discards). */
  onSave: (result: EditedImage | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [crop, setCrop] = useState<CropId>("free");
  const [rotation, setRotation] = useState(0);
  const [adjust, setAdjust] = useState<Adjustments>(NEUTRAL);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(92);

  // Load the file into an Image once.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () =>
      setError("No se pudo abrir la imagen. Prueba con PNG o JPEG.");
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Base geometry after rotation + crop (in source pixels).
  const base = useMemo(() => {
    if (!img) return null;
    const rot = ((rotation % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    const w = swap ? img.naturalHeight : img.naturalWidth;
    const h = swap ? img.naturalWidth : img.naturalHeight;
    const r = ratioOf(crop);
    if (!r) return { w, h };
    // Largest centered rectangle with the requested ratio that fits w×h.
    let cw = w;
    let ch = cw / r;
    if (ch > h) {
      ch = h;
      cw = h * r;
    }
    return { w: Math.round(cw), h: Math.round(ch) };
  }, [img, rotation, crop]);

  // Render preview whenever anything changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!img || !base || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = base.w;
    canvas.height = base.h;
    ctx.save();
    ctx.filter = `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) saturate(${adjust.saturation}%)`;
    const rot = ((rotation % 360) + 360) % 360;
    ctx.translate(base.w / 2, base.h / 2);
    ctx.rotate((rot * Math.PI) / 180);
    const dw = rot === 90 || rot === 270 ? base.h : base.w;
    const dh = rot === 90 || rot === 270 ? base.w : base.h;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }, [img, base, rotation, adjust]);

  const exportImage = async () => {
    if (!img || !base) return;
    setBusy(true);
    try {
      // Re-render at full resolution off-screen (the preview canvas may be
      // CSS-scaled, but keep it identical to be safe).
      const out = document.createElement("canvas");
      out.width = base.w;
      out.height = base.h;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("Canvas no disponible.");
      ctx.filter = `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) saturate(${adjust.saturation}%)`;
      const rot = ((rotation % 360) + 360) % 360;
      ctx.translate(base.w / 2, base.h / 2);
      ctx.rotate((rot * Math.PI) / 180);
      const dw = rot === 90 || rot === 270 ? base.h : base.w;
      const dh = rot === 90 || rot === 270 ? base.w : base.h;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);

      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob(resolve, format === "png" ? "image/png" : "image/jpeg", quality / 100),
      );
      if (!blob) throw new Error("No se pudo exportar la imagen.");
      onSave({ blob, width: base.w, height: base.h, type: format === "png" ? "image/png" : "image/jpeg" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar.");
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-sm border-border/70 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-light tracking-tight">
            Editar imagen
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Recorta, rota y ajusta antes de publicar. La exportación se hace en
            tu navegador.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-[13px] text-destructive">{error}</p>
        ) : !img || !base ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row">
            {/* Preview */}
            <div className="flex flex-1 items-center justify-center rounded-sm border border-border/60 bg-muted/30 p-3">
              <canvas
                ref={canvasRef}
                className="max-h-[320px] max-w-full object-contain"
              />
            </div>

            {/* Controls */}
            <div className="flex w-full flex-col gap-4 sm:w-64">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Recorte
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CROP_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCrop(p.id)}
                      className={
                        crop === p.id
                          ? "rounded-sm bg-foreground px-2 py-1 font-mono text-[10px] text-background"
                          : "rounded-sm border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Rotación · {rotation}°
                </label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 rounded-sm"
                    onClick={() => setRotation((r) => (r + 270) % 360)}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 rounded-sm"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                  >
                    <RotateCw className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-sm text-muted-foreground"
                    onClick={() => setRotation(0)}
                    title="Restablecer"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>

              {(
                [
                  ["brightness", "Brillo", 0, 200],
                  ["contrast", "Contraste", 0, 200],
                  ["saturation", "Saturación", 0, 200],
                ] as const
              ).map(([key, label, min, max]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {label}
                    </label>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {adjust[key]}%
                    </span>
                  </div>
                  <Slider
                    value={[adjust[key]]}
                    min={min}
                    max={max}
                    step={1}
                    onValueChange={([v]) =>
                      setAdjust((a) => ({ ...a, [key]: v }))
                    }
                  />
                </div>
              ))}

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-sm text-muted-foreground"
                  onClick={() => setAdjust(NEUTRAL)}
                >
                  <Sparkles className="mr-1.5 size-3.5" />
                  Restablecer ajustes
                </Button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Formato
                </label>
                <div className="flex gap-1.5">
                  {(["png", "jpeg"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={
                        format === f
                          ? "flex-1 rounded-sm bg-foreground px-2 py-1 font-mono text-[10px] uppercase text-background"
                          : "flex-1 rounded-sm border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:text-foreground"
                      }
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {format === "jpeg" && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Calidad
                      </label>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {quality}
                      </span>
                    </div>
                    <Slider
                      value={[quality]}
                      min={40}
                      max={100}
                      step={1}
                      onValueChange={([v]) => setQuality(v)}
                    />
                  </div>
                )}
              </div>

              <p className="font-mono text-[10px] text-muted-foreground">
                {base.w} × {base.h} px ·{" "}
                {format === "png" ? "PNG sin pérdida" : `JPEG q${quality}`}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onSave(null)}
            disabled={busy}
            className="rounded-sm text-muted-foreground"
          >
            <X className="mr-1.5 size-3.5" />
            Descartar
          </Button>
          <Button
            onClick={() => void exportImage()}
            disabled={busy || !img || !!error}
            className="rounded-sm"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Download className="mr-1.5 size-3.5" />
                Usar imagen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
