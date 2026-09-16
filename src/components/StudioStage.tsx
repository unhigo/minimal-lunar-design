import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  ImageIcon,
  Loader2,
  Menu,
  Moon,
  Redo2,
  Undo2,
} from "lucide-react";
import { MoonCalendarSvg } from "@/components/MoonCalendarSvg";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { useLunar } from "@/hooks/use-lunar-context";
import {
  exportJpg,
  exportPng,
  exportSvg,
  exportWebp,
} from "@/lib/lunar-export";
import type { LunarState } from "@/lib/lunar";
import { PALETTES } from "@/lib/lunar";
import { cn } from "@/lib/utils";

type ExportFormat = "SVG" | "PNG" | "JPG" | "WebP";

const EXPORTS: Array<{ format: ExportFormat; busyLabel: string }> = [
  { format: "SVG", busyLabel: "SVG" },
  { format: "PNG", busyLabel: "PNG" },
  { format: "JPG", busyLabel: "JPG" },
  { format: "WebP", busyLabel: "WebP" },
];

export function StudioStage({
  onOpenPanel,
}: {
  onOpenPanel?: () => void;
}) {
  const {
    state,
    updateState,
    undo,
    redo,
    canUndo,
    canRedo,
    isExporting,
    setIsExporting,
  } = useLunar();

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * factor, 0.2), 6));
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const filename = `lunar-${state.year}-${state.exportResolution}.${format.toLowerCase()}`;
      if (format === "SVG") {
        exportSvg(state, filename);
      } else if (format === "PNG") {
        await exportPng(state, state.exportResolution, filename);
      } else if (format === "JPG") {
        await exportJpg(state, state.exportResolution, filename);
      } else if (format === "WebP") {
        await exportWebp(state, state.exportResolution, filename);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const setRes = (res: LunarState["exportResolution"]) =>
    updateState({ exportResolution: res });

  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {state.showStars && <Starfield />}

      {/* Top toolbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center p-3 sm:p-4">
        <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-card/85 px-3 py-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 md:hidden"
              onClick={onOpenPanel}
            >
              <Menu className="size-4" />
              Controls
            </Button>

            <div className="ml-1 hidden items-center gap-2 pr-2 sm:flex">
              <Moon className="size-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">
                {state.year}
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              {EXPORTS.map(({ format }) => (
                <Button
                  key={format}
                  variant="ghost"
                  size="sm"
                  disabled={isExporting}
                  onClick={() => void handleExport(format)}
                  className="gap-1 px-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {isExporting ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Download className="size-3" />
                  )}
                  {format}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {(["HD", "2K", "4K"] as const).map((res) => (
              <button
                key={res}
                onClick={() => setRes(res)}
                className={cn(
                  "rounded px-1.5 py-1 font-mono text-[10px] transition-colors",
                  state.exportResolution === res
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {res}
              </button>
            ))}
            <div className="mx-1 h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 cursor-grab touch-none items-center justify-center overflow-hidden pt-16 active:cursor-grabbing"
        onMouseDown={(e) => {
          if (e.button === 0 || e.button === 1 || e.altKey) {
            dragging.current = true;
            last.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onMouseMove={(e) => {
          if (!dragging.current) return;
          const dx = e.clientX - last.current.x;
          const dy = e.clientY - last.current.y;
          last.current = { x: e.clientX, y: e.clientY };
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
        }}
        onMouseUp={() => {
          dragging.current = false;
        }}
        onMouseLeave={() => {
          dragging.current = false;
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            dragging.current = true;
            last.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }
        }}
        onTouchMove={(e) => {
          if (!dragging.current || e.touches.length !== 1) return;
          const dx = e.touches[0].clientX - last.current.x;
          const dy = e.touches[0].clientY - last.current.y;
          last.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
        }}
        onTouchEnd={() => {
          dragging.current = false;
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center px-2 sm:px-4"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging.current ? "none" : "transform 80ms ease-out",
          }}
        >
          <MoonCalendarSvg state={state} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/85 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Palettes
          </span>
          <div className="flex flex-1 items-center gap-1 overflow-x-auto py-0.5 custom-scrollbar">
            {PALETTES.map((p) => (
              <button
                key={p.name}
                onClick={() => updateState({ ...p.config })}
                className="flex shrink-0 items-center gap-1.5 rounded border border-border bg-background/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <span
                  className="inline-flex size-3 rounded-full border border-border"
                  style={{ background: p.config.moonLit }}
                />
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label
              className="flex cursor-pointer items-center gap-1.5 rounded border border-border bg-background/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <ImageIcon className="size-3" />
              Background
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) =>
                    updateState({ bgImage: (ev.target?.result as string) ?? null });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {state.bgImage && (
              <button
                onClick={() => updateState({ bgImage: null })}
                className="rounded border border-destructive/40 px-2 py-1 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
              >
                Remove
              </button>
            )}
            {(
              [
                { label: "BG", key: "bgColor" },
                { label: "Moon", key: "moonLit" },
                { label: "Text", key: "textColor" },
                { label: "Accent", key: "accentColor" },
              ] as const
            ).map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {c.label}
                <input
                  type="color"
                  value={state[c.key]}
                  onChange={(e) =>
                    updateState({ [c.key]: e.target.value } as Partial<LunarState>)
                  }
                  className="size-4 cursor-pointer rounded border border-border bg-transparent p-0"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
