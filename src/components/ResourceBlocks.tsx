import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { ResourceBlock } from "@/lib/blocks";
import { groupBlocks, ratioValue, youtubeEmbedUrl } from "@/lib/blocks";
import { timeAgo } from "@/lib/catalog";

/**
 * Renders the block composition of a resource: standalone images and videos,
 * text notes, and merged galleries (grid) / sliders (carousel) from
 * consecutive same-type blocks. Pure presentation — no editing affordances.
 */

function ImageBlock({ block }: { block: ResourceBlock }) {
  const [open, setOpen] = useState(false);
  if (!block.url) return null;
  return (
    <figure>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in overflow-hidden rounded-sm border border-border/60"
        aria-label="Ampliar imagen"
      >
        <img
          src={block.url}
          alt={block.meta?.caption ?? "Imagen del recurso"}
          loading="lazy"
          className="max-h-[640px] w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
        />
      </button>
      {block.meta?.caption && (
        <figcaption className="mt-2 font-mono text-[11px] text-muted-foreground">
          {block.meta.caption}
        </figcaption>
      )}
      {open && (
        <Lightbox
          urls={[block.url]}
          captions={[block.meta?.caption ?? ""]}
          index={0}
          onClose={() => setOpen(false)}
          onNavigate={() => undefined}
        />
      )}
    </figure>
  );
}

function VideoBlock({ block }: { block: ResourceBlock }) {
  if (!block.url) return null;
  const embed = youtubeEmbedUrl(block.url);
  const ratio = ratioValue(block.meta?.ratio);
  return (
    <figure>
      <div
        className="w-full overflow-hidden rounded-sm border border-border/60 bg-black"
        style={{ aspectRatio: ratio }}
      >
        {embed ? (
          <iframe
            src={embed}
            title={block.meta?.caption ?? "Video del recurso"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <video
            src={block.url}
            controls
            autoPlay={block.meta?.autoplay ?? false}
            loop={block.meta?.loop ?? false}
            muted={block.meta?.muted ?? false}
            playsInline
            preload="metadata"
            className="h-full w-full"
          />
        )}
      </div>
      {block.meta?.caption && (
        <figcaption className="mt-2 font-mono text-[11px] text-muted-foreground">
          {block.meta.caption}
        </figcaption>
      )}
    </figure>
  );
}

function TextBlock({ block }: { block: ResourceBlock }) {
  return (
    <div className="rounded-sm border-l-2 border-border bg-muted/20 px-5 py-4">
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
        {block.text}
      </p>
    </div>
  );
}

function GalleryGroup({ blocks }: { blocks: ResourceBlock[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const visible = blocks.filter((b) => b.url);
  if (visible.length === 0) return null;
  const many = visible.length > 2;

  return (
    <figure>
      <div className={`grid gap-2 ${many ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        {visible.map((b, i) => (
          <button
            key={b._id}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative overflow-hidden rounded-sm border border-border/60"
            aria-label={`Ampliar imagen ${i + 1}`}
          >
            <img
              src={b.url!}
              alt={b.meta?.caption ?? `Imagen ${i + 1} de la galería`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>
      {blocks.some((b) => b.meta?.caption) && (
        <figcaption className="mt-2 font-mono text-[11px] text-muted-foreground">
          {blocks.find((b) => b.meta?.caption)?.meta?.caption}
        </figcaption>
      )}
      {lightbox !== null && (
        <Lightbox
          urls={visible.map((b) => b.url!)}
          captions={visible.map((b) => b.meta?.caption ?? "")}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={(next) =>
            setLightbox((prev) =>
              prev === null
                ? null
                : (prev + next + visible.length) % visible.length,
            )
          }
        />
      )}
    </figure>
  );
}

function Lightbox({
  urls,
  captions,
  index,
  onClose,
  onNavigate,
}: {
  urls: string[];
  captions: string[];
  index: number;
  onClose: () => void;
  onNavigate: (delta: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(1);
      if (e.key === "ArrowLeft") onNavigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNavigate]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imágenes"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar visor"
        className="absolute right-4 top-4 rounded-sm p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-5" />
      </button>
      {urls.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-sm border border-border/60 bg-background/60 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm border border-border/60 bg-background/60 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
      <figure onClick={(e) => e.stopPropagation()} className="max-w-5xl">
        <img
          src={urls[index]}
          alt={captions[index] || "Imagen ampliada"}
          className="max-h-[80vh] max-w-full rounded-sm object-contain"
        />
        {(captions[index] || urls.length > 1) && (
          <figcaption className="mt-3 text-center font-mono text-[11px] text-muted-foreground">
            {captions[index]}
            {urls.length > 1 && ` · ${index + 1}/${urls.length}`}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

function SliderGroup({ blocks }: { blocks: ResourceBlock[] }) {
  const visible = blocks.filter((b) => b.url);
  const [index, setIndex] = useState(0);
  if (visible.length === 0) return null;
  const current = visible[Math.min(index, visible.length - 1)]!;
  const ratio = ratioValue(current.meta?.ratio);

  const go = (delta: number) =>
    setIndex((prev) => (prev + delta + visible.length) % visible.length);

  return (
    <figure>
      <div
        className="relative w-full overflow-hidden rounded-sm border border-border/60 bg-muted/20"
        style={{ aspectRatio: ratio }}
      >
        {visible.map((b, i) => (
          <img
            key={b._id}
            src={b.url!}
            alt={b.meta?.caption ?? `Diapositiva ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}
        {visible.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-sm border border-border/60 bg-background/70 p-2 text-foreground transition-colors hover:bg-background"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border border-border/60 bg-background/70 p-2 text-foreground transition-colors hover:bg-background"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {visible.map((b, i) => (
                <button
                  key={b._id}
                  type="button"
                  aria-label={`Ir a diapositiva ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`size-1.5 rounded-full transition-colors ${
                    i === index ? "bg-foreground" : "bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {current.meta?.caption && (
        <figcaption className="mt-2 font-mono text-[11px] text-muted-foreground">
          {current.meta.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function ResourceBlocks({
  blocks,
  compact,
}: {
  blocks: ResourceBlock[];
  compact?: boolean;
}) {
  if (blocks.length === 0) return null;
  const groups = groupBlocks(blocks);

  return (
    <section className={compact ? "flex flex-col gap-4" : "flex flex-col gap-8"}>
      {groups.map((g, gi) => {
        if (g.kind === "gallery") return <GalleryGroup key={gi} blocks={g.blocks} />;
        if (g.kind === "slider") return <SliderGroup key={gi} blocks={g.blocks} />;
        const block = g.blocks[0]!;
        if (block.type === "image") {
          return <ImageBlock key={block._id} block={block} />;
        }
        if (block.type === "video") return <VideoBlock key={block._id} block={block} />;
        return <TextBlock key={block._id} block={block} />;
      })}
    </section>
  );
}

/** Small attribution line used in the editor list. */
export function BlockMetaLine({ block }: { block: ResourceBlock }) {
  const bits: string[] = [timeAgo(block.createdAt)];
  if (block.meta?.name) bits.push(block.meta.name);
  if (block.meta?.size) bits.push(`${(block.meta.size / 1024).toFixed(0)} KB`);
  if (block.meta?.width && block.meta?.height) {
    bits.push(`${block.meta.width}×${block.meta.height}`);
  }
  return (
    <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {bits.join(" · ")}
    </p>
  );
}
