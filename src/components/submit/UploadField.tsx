/**
 * UploadField — minimalist upload control over the existing Convex pipeline
 * (files.generateUploadUrl → POST → files.attach). Works with the file picker
 * alone; drag & drop is an extra, never the only path.
 */

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadField({
  label,
  accept,
  busy,
  previewUrl,
  onFile,
  onRemove,
  hint,
  aspect = "square",
  compact = false,
}: {
  label: string;
  accept: string;
  busy: boolean;
  previewUrl: string | null;
  onFile: (file: File) => void;
  onRemove?: () => void;
  hint?: string;
  aspect?: "square" | "wide";
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) onFile(f);
      }}
    />
  );

  if (previewUrl) {
    return (
      <div className="space-y-2">
        {input}
        <div className="flex items-center gap-3">
          <img
            src={previewUrl}
            alt={label}
            className={cn(
              "border border-border/70 object-cover",
              aspect === "square" ? "size-14 object-contain" : "h-20 w-36",
            )}
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="btn-outline h-8 px-3 text-[12px]"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                className="btn-outline h-8 px-3 text-[12px]"
                disabled={busy}
                onClick={onRemove}
              >
                <Trash2 className="size-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {input}
      <button
        type="button"
        aria-label={`${label}${hint ? ` (${hint})` : ""}`}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed px-4 text-center transition-colors hover:border-foreground/40",
          compact ? "aspect-[4/3] py-4" : "py-8",
          aspect === "wide" && !compact && "py-6",
          dragOver ? "border-foreground/60 bg-muted/30" : "border-border/70",
          busy && "opacity-70",
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-4 text-muted-foreground" />
        )}
        <span className="text-[12px] text-muted-foreground">
          {busy ? "Subiendo…" : `+ ${label}`}
        </span>
        {hint && !busy && (
          <span className="font-mono text-[10px] text-muted-foreground/70">{hint}</span>
        )}
      </button>
    </div>
  );
}

/** Multi-file trigger used for the screenshots grid (picker-only, no dropzone). */
export function AddShotTile({
  label,
  accept,
  busy,
  onFiles,
}: {
  label: string;
  accept: string;
  busy: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      <button
        type="button"
        aria-label={label}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length) onFiles(files);
        }}
        className={cn(
          "flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-border/70 px-2 text-center transition-colors hover:border-foreground/40",
          busy && "opacity-70",
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-4 text-muted-foreground" />
        )}
        <span className="text-[11px] text-muted-foreground">
          {busy ? "Subiendo…" : `+ ${label}`}
        </span>
      </button>
    </>
  );
}
