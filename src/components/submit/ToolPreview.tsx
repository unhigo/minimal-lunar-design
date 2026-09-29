/**
 * ToolPreview — live directory-card preview for the /submit workflow.
 * Renders the data the user has actually entered (never mock content).
 */

import { badgesFor, SUBMIT_CATEGORIES, PRICING_MODELS, type SubmitPayload } from "@/lib/submit-schema";
import { cn } from "@/lib/utils";

export interface PreviewModel {
  title: string;
  tagline: string;
  category: string;
  pricing: string;
  logoUrl: string | null;
  thumbUrl: string | null;
  platforms: string[];
  tags: string[];
  license: string;
  discountCode?: string;
  discountPercent?: number;
  videoUrl?: string;
  senderRole: string;
}

export function ToolPreview({
  model,
  className,
}: {
  model: PreviewModel;
  className?: string;
}) {
  const badges = badgesFor({
    category: (model.category || "web-apps") as SubmitPayload["category"],
    pricing: (model.pricing || "free") as SubmitPayload["pricing"],
    license: (model.license || "personal") as SubmitPayload["license"],
    senderRole: (model.senderRole || "curator") as SubmitPayload["senderRole"],
    platforms: model.platforms as SubmitPayload["platforms"],
    discountCode: model.discountCode,
    discountPercent: model.discountPercent,
    videoUrl: model.videoUrl,
  });

  const categoryLabel =
    SUBMIT_CATEGORIES.find((c) => c.id === model.category)?.label ?? null;
  const pricingLabel =
    PRICING_MODELS.find((p) => p.id === model.pricing)?.label ?? null;

  return (
    <article
      aria-label="Preview de la ficha en el directorio"
      className={cn("border border-border/70 bg-background", className)}
    >
      {/* Cover / thumb — falls back to logo, then a technical placeholder */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-border/70 bg-muted/30">
        {model.thumbUrl ? (
          <img
            src={model.thumbUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : model.logoUrl ? (
          <div className="flex size-full items-center justify-center">
            <img
              src={model.logoUrl}
              alt=""
              className="size-16 object-contain"
            />
          </div>
        ) : (
          <div className="flex size-full items-center justify-center">
            <span
              aria-hidden
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60"
            >
              — sin imagen —
            </span>
          </div>
        )}
        {model.thumbUrl && model.logoUrl && (
          <img
            src={model.logoUrl}
            alt=""
            className="absolute bottom-2 left-2 size-8 border border-border/70 bg-background object-contain p-0.5"
          />
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-[15px] font-medium tracking-tight">
            {model.title.trim() || "Nombre de la herramienta"}
          </h3>
          {model.logoUrl && (
            <img
              src={model.logoUrl}
              alt=""
              className="size-7 shrink-0 border border-border/70 object-contain p-0.5"
            />
          )}
        </div>

        <p className="min-h-10 text-[13px] leading-relaxed text-muted-foreground">
          {model.tagline.trim() || "La frase corta que resume la herramienta aparecerá aquí."}
        </p>

        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {[categoryLabel, ...model.platforms.slice(0, 2)].filter(Boolean).join(" · ") || "—"}
        </p>

        {model.tags.length > 0 && (
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {model.tags.map((t) => `#${t}`).join(" ")}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
          {pricingLabel && (
            <span className="inline-flex items-center rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {pricingLabel}
            </span>
          )}
          {badges.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              <span aria-hidden>{b.glyph}</span> {b.label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
